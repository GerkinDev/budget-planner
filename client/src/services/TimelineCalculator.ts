import {Operation} from '@budget-planner/models';
import {Temporal, toTemporalInstant} from '@js-temporal/polyfill';
import assert from 'assert';
import {ReadonlyDeep, Spread} from 'type-fest';
import {sortUsing} from '../helpers/functional';

type DP = TimelineCalculator.ComputedOperationPoint;

const tz = Temporal.Now.timeZoneId();
const toPlainDate = (date: Date) =>
  toTemporalInstant.call(date).toZonedDateTimeISO(tz).toPlainDate();

const getDateCode = (date: Date) =>
  Math.floor(date.getTime() / (1000 * 60 * 60 * 24));

type ExpandedOperation = {
  source: ReadonlyDeep<Operation>;
  result: ReadonlyDeep<Operation.Checkpoint | Operation.OneTime>;
};
const _expandOperations = (
  operations: ReadonlyDeep<Operation[]>,
  until: Date = new Date(
    Math.max.apply(
      null,
      operations.map(op => op.date.getTime()),
    ),
  ),
) =>
  operations
    .flatMap<ExpandedOperation>(op => {
      if (op.type === Operation.Type.Recurring) {
        const startTemporal = toPlainDate(op.date);
        const operationDuration = startTemporal.until(
          toPlainDate(op.until ?? until),
        );
        const operationsPeriodicityRecurrence = operationDuration.total({
          unit: op.periodicity.interval,
          relativeTo: startTemporal,
        });
        const totalOperationsOccurrences =
          operationsPeriodicityRecurrence / op.periodicity.every;

        assert(
          totalOperationsOccurrences >= 0 &&
            isFinite(totalOperationsOccurrences) &&
            !isNaN(totalOperationsOccurrences),
          `Invalid count of operation occurrences ${totalOperationsOccurrences}`,
        );

        return new Array(Math.floor(totalOperationsOccurrences + 1))
          .fill(0)
          .map((_, i) => ({
            result: {
              ...op,
              type: Operation.Type.OneTime,
              date: new Date(
                startTemporal
                  .add(
                    Temporal.Duration.from({
                      [`${op.periodicity.interval}s`]: op.periodicity.every * i,
                    }),
                  )
                  .toString(),
              ),
            },
            source: op,
          }));
      }
      return [{source: op, result: op}];
    })
    .sort(sortUsing(op => op.result.date.getTime()));

const _accumulateOperations = (
  operations: ReadonlyDeep<Operation.Checkpoint | Operation.OneTime>[],
) =>
  operations.reduce<
    Spread<
      DP,
      {operations: ReadonlyDeep<Operation.Checkpoint | Operation.OneTime>[]}
    >[]
  >((acc, op) => {
    const prev = acc.at(-1);
    const newEntry =
      op.type === Operation.Type.Checkpoint
        ? {
            actual: op.amount,
            expected: prev?.expected ?? 0,
            date: op.date,
            operations: [op],
          }
        : {
            expected: (prev?.actual ?? prev?.expected ?? 0) + op.amount,
            date: op.date,
            operations: [op],
          };
    if (newEntry.date.getTime() === prev?.date.getTime()) {
      return [
        ...acc.slice(0, -1),
        {
          ...prev,
          ...newEntry,
          operations: [...newEntry.operations, ...prev.operations],
        },
      ];
    }
    return [...acc, {...newEntry, code: getDateCode(newEntry.date)}];
  }, []);

export class TimelineCalculator {
  public static for(operations: Operation[]) {
    return new this(operations);
  }

  public readonly operations: readonly ReadonlyDeep<Operation>[];
  private _computedDataPoints?: readonly DP[];
  public get computedDataPoints() {
    if (!this._computedDataPoints) {
      const expandedOperations = _expandOperations(this.operations);
      const operationsSourceMap = new WeakMap(
        expandedOperations.map(({result, source}) => [result, source] as const),
      );
      const accumulatedOperations = _accumulateOperations(
        expandedOperations.map(op => op.result),
      );
      this._computedDataPoints = accumulatedOperations.map(accumulated => ({
        ...accumulated,
        operations: accumulated.operations.map(
          op =>
            operationsSourceMap.get(op) ??
            assert.fail(`Could not get source for operation ${op.label}`),
        ),
      }));
    }
    return this._computedDataPoints;
  }

  private constructor(operations: ReadonlyDeep<Operation[]>) {
    this.operations = operations
      .slice()
      .sort(sortUsing(({date}) => date.getTime()));
  }

  public rangeAt(
    date: Date,
  ):
    | number
    | [min: {date: Date; value: number}, max: {date: Date; value: number}] {
    const dataPoints = this.computedDataPoints;
    if (!dataPoints || dataPoints.length === 0) {
      return 0;
    }

    const dateCode = getDateCode(date);

    const closest = dataPoints.reduce<{
      prev?: DP;
      next?: DP;
    }>((acc, dp) => {
      let {next, prev} = acc;
      next = [dp, next]
        .filter((dp2): dp2 is DP => !!dp2 && dp2.code >= dateCode)
        .sort(sortUsing(dp2 => dp2.code, 'asc'))[0];
      prev = [dp, prev]
        .filter((dp2): dp2 is DP => !!dp2 && dp2.code <= dateCode)
        .sort(sortUsing(dp2 => dp2.code, 'desc'))[0];
      return {next: next, prev: prev};
    }, {});
    assert(closest.next || closest.prev);
    assert(!closest.next || closest.next.code >= dateCode);
    assert(!closest.prev || closest.prev.code <= dateCode);

    if (closest.prev && closest.next) {
      if (closest.next.code === closest.prev.code) {
        return closest.next.actual ?? closest.next.expected;
      }
      return [
        {
          date: closest.prev.date,
          value: closest.prev.actual ?? closest.prev.expected,
        },
        {
          date: closest.next.date,
          value: closest.next.actual ?? closest.next.expected,
        },
      ];
    }
    if (closest.prev) {
      return closest.prev.actual ?? closest.prev.expected;
    }
    return 0;
  }

  public amountAt(date: Date): number {
    const range = this.rangeAt(date);
    if (typeof range === 'number') {
      return range;
    }
    const prev = {d: range[0].date.getTime(), v: range[0].value};
    const next = {d: range[1].date.getTime(), v: range[1].value};
    const curr = date.getTime();
    const t = 1 - (next.d - curr) / (next.d - prev.d);
    const lerped = (1 - t) * prev.v + t * next.v;
    return lerped;
  }
}
export namespace TimelineCalculator {
  export type ComputedOperationPoint = ReadonlyDeep<{
    date: Date;
    code: number;
    operations: Operation[];
    expected: number;
    actual?: number;
  }>;
}

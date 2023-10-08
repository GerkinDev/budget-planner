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
      if (until && op.date.getTime() > until.getTime()) {
        return [];
      }
      if (op.type === Operation.Type.Recurring) {
        const startTemporal = toPlainDate(op.date);
        const operationDuration = startTemporal.until(
          toPlainDate(until ?? op.until),
        );
        const operationsPeriodicityRecurrence = operationDuration.total({
          unit: op.periodicity.interval,
          relativeTo: startTemporal,
        });
        const totalOperationsOccurrences =
          operationsPeriodicityRecurrence / op.periodicity.every;

        assert(
          isFinite(totalOperationsOccurrences) &&
            !isNaN(totalOperationsOccurrences),
          `Invalid count of operation occurrences ${totalOperationsOccurrences}`,
        );
        if (totalOperationsOccurrences <= 0) {
          return [];
        }

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
  operations
    .map(op => ({operation: op, code: getDateCode(op.date)}))
    .reduce<
      Spread<
        DP,
        {operations: ReadonlyDeep<Operation.Checkpoint | Operation.OneTime>[]}
      >[]
    >((acc, {operation, code}) => {
      const prev = acc.at(-1);
      const newEntry =
        operation.type === Operation.Type.Checkpoint
          ? {
              actual: operation.amount,
              expected: prev?.expected ?? 0,
              date: operation.date,
              operations: [operation],
              code: code,
            }
          : {
              expected:
                (prev?.actual ?? prev?.expected ?? 0) + operation.amount,
              date: operation.date,
              operations: [operation],
              code: code,
            };
      if (newEntry.code === prev?.code) {
        return [
          ...acc.slice(0, -1),
          {
            ...prev,
            ...newEntry,
            operations: [...newEntry.operations, ...prev.operations],
          },
        ];
      }
      return [...acc, {...newEntry}];
    }, []);

const _computeDataPoints = (
  operations: ReadonlyDeep<Operation[]>,
  from?: Date,
  to?: Date,
) => {
  const expandedOperations = _expandOperations(operations, to);
  const operationsSourceMap = new WeakMap(
    expandedOperations.map(({result, source}) => [result, source] as const),
  );
  const accumulatedOperations = _accumulateOperations(
    expandedOperations.map(op => op.result),
  );
  const ops = accumulatedOperations.map(accumulated => ({
    ...accumulated,
    operations: accumulated.operations.map(
      op =>
        operationsSourceMap.get(op) ??
        assert.fail(`Could not get source for operation ${op.label}`),
    ),
  }));
  if (from) {
    const fromCode = getDateCode(from);
    return ops.filter(op => op.code >= fromCode);
  }
  return ops;
};

export class TimelineCalculator {
  public static for(operations: ReadonlyDeep<Operation[]>) {
    return new this(operations);
  }

  public readonly operations: ReadonlyDeep<Operation[]>;
  private _computedDataPoints?: readonly DP[];
  public get computedDataPoints() {
    if (!this._computedDataPoints) {
      this._computedDataPoints = _computeDataPoints(this.operations);
    }
    return this._computedDataPoints;
  }

  private constructor(operations: ReadonlyDeep<Operation[]>) {
    this.operations = operations
      .slice()
      .sort(sortUsing(({date}) => date.getTime()));
  }

  public forRange(from?: Date, to?: Date) {
    if (!from && !to) {
      return this.computedDataPoints;
    }
    return _computeDataPoints(this.operations, from, to);
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

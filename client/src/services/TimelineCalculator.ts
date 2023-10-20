import assert from 'assert';

import {Operation} from '@budget-planner/models';
import {Temporal, toTemporalInstant} from '@js-temporal/polyfill';
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
  operations: ReadonlyDeep<ExpandedOperation>[],
): DP[] =>
  operations
    .map(op => ({operation: op, code: getDateCode(op.result.date)}))
    .reduce<Spread<DP, {operations: ReadonlyDeep<ExpandedOperation>[]}>[]>(
      (acc, {operation, code}) => {
        const prev = acc.at(-1);
        const newEntry =
          operation.result.type === Operation.Type.Checkpoint
            ? {
                actual: operation.result.amount,
                expected: prev?.expected ?? 0,
                date: operation.result.date,
                operations: [operation],
                code: code,
              }
            : {
                expected:
                  (prev?.actual ?? prev?.expected ?? 0) +
                  operation.result.amount,
                date: operation.result.date,
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
      },
      [],
    );

const _computeDataPoints = function* (
  operations: ReadonlyDeep<Operation[]>,
  includePrevious: boolean,
  from?: Date,
  to?: Date,
): Iterable<DP> {
  const expandedOperations = _expandOperations(operations, to);
  const accumulatedOperations = _accumulateOperations(expandedOperations);
  if (from) {
    const fromCode = getDateCode(from);
    var ops = accumulatedOperations.sort(sortUsing(op => op.code));
    let prev: DP | null = null;
    for (const op of ops) {
      if (op.code > fromCode) {
        if (prev) {
          yield prev;
        }
      }
      prev = op;
    }
    if (prev) {
      yield prev;
    }
    return;
  }
  yield* accumulatedOperations;
  return;
};

export class TimelineCalculator {
  public static for(operations: ReadonlyDeep<Operation[]>) {
    return new this(operations);
  }

  public readonly operations: ReadonlyDeep<Operation[]>;
  private _computedDataPoints?: readonly DP[];
  public get computedDataPoints() {
    if (!this._computedDataPoints) {
      this._computedDataPoints = [
        ..._computeDataPoints(this.operations, false),
      ];
    }
    return this._computedDataPoints;
  }

  private constructor(operations: ReadonlyDeep<Operation[]>) {
    this.operations = operations
      .slice()
      .sort(sortUsing(({date}) => date.getTime()));
  }

  public forRange(from?: Date, to?: Date, includePrevious = true) {
    if (!from && !to) {
      return this.computedDataPoints;
    }
    return [..._computeDataPoints(this.operations, includePrevious, from, to)];
  }
}
export namespace TimelineCalculator {
  export type ComputedOperationPoint = ReadonlyDeep<{
    date: Date;
    code: number;
    operations: ExpandedOperation[];
    expected: number;
    actual?: number;
  }>;
}

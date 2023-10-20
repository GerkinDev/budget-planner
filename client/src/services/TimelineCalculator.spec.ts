import {Operation} from '@budget-planner/models';
import {omit} from 'ramda';
import {Except} from 'type-fest';

import {TimelineCalculator} from './TimelineCalculator';

const _baseDate = new Date('2000-01-01');
const d: {
  (daysSinceStart: number): Date;
  (yearSInceStart: number, month: number, day: number): Date;
} = (
  ...args:
    | [daysSinceStart: number]
    | [yearSInceStart: number, month: number, day: number]
) => {
  if (args.length === 1) {
    return new Date(_baseDate.getTime() + args[0] * 24 * 60 * 60 * 1000);
  }
  return new Date(
    _baseDate.getFullYear() + args[0],
    _baseDate.getMonth() + args[1],
    _baseDate.getDate() + args[2],
  );
};

describe('computedDataPoints', () => {
  it.each<
    [
      source: Array<Except<Operation, 'label' | 'date'> & {date: number}>,
      expected: Array<{
        date: number;
        src: number[];
        expected: number;
        actual?: number;
      }>,
    ]
  >([
    [
      [
        {type: Operation.Type.OneTime, amount: 10, date: 0},
        {type: Operation.Type.OneTime, amount: 0, date: 1},
      ],
      [
        {date: 0, expected: 10, src: [0]},
        {date: 1, expected: 10, src: [1]},
      ],
    ],
    [
      [
        {type: Operation.Type.Checkpoint, amount: 10, date: 0},
        {type: Operation.Type.OneTime, amount: 0, date: 1},
      ],
      [
        {date: 0, expected: 0, actual: 10, src: [0]},
        {date: 1, expected: 10, src: [1]},
      ],
    ],
    [
      [
        {
          type: Operation.Type.Recurring,
          amount: 10,
          date: 0,
          periodicity: {every: 1, interval: 'day'},
        },
        {type: Operation.Type.OneTime, amount: 0, date: 1},
      ],
      [
        {date: 0, expected: 10, src: [0]},
        {date: 1, expected: 20, src: [0, 1]},
      ],
    ],
    [
      [
        {
          type: Operation.Type.Recurring,
          amount: 10,
          date: 0,
          periodicity: {every: 1, interval: 'week'},
        },
        {type: Operation.Type.OneTime, amount: 0, date: 2 * 7},
      ],
      [
        {date: 0 * 7, expected: 10, src: [0]},
        {date: 1 * 7, expected: 20, src: [0]},
        {date: 2 * 7, expected: 30, src: [0, 1]},
      ],
    ],
    [
      [
        {
          type: Operation.Type.Recurring,
          amount: 1,
          date: 0,
          periodicity: {every: 2, interval: 'day'},
        },
        {type: Operation.Type.OneTime, amount: 1, date: 1},
        {type: Operation.Type.Checkpoint, amount: 10, date: 3},
        {type: Operation.Type.OneTime, amount: 1, date: 5},
      ],
      [
        {date: 0, expected: 1, src: [0]},
        {date: 1, expected: 2, src: [1]},
        {date: 2, expected: 3, src: [0]},
        {date: 3, expected: 3, actual: 10, src: [2]},
        {date: 4, expected: 11, src: [0]},
        {date: 5, expected: 12, src: [3]},
      ],
    ],
  ])('%j should output %j', (source, expected) => {
    const sourceFull = source.map((src, i) => ({
      ...src,
      date: d(src.date),
      label: `OP ${src.type} + ${src.amount} ${i}`,
    }));
    expect(TimelineCalculator.for(sourceFull).computedDataPoints).toEqual(
      expected.map(e => ({
        ...omit(['src'], e),
        date: d(e.date),
        code: expect.toBeNumber(),
        operations: e.src
          ? expect.toIncludeSameMembers(
              e.src.map(src =>
                expect.objectContaining({source: sourceFull[src]}),
              ),
            )
          : expect.anything(),
      })),
    );
  });
});

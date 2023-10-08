import {findBestScale, getScaleMarkers} from './utils';

describe(findBestScale, () => {
  it.each([
    {range: 10, max: 10, expected: 1},
    {range: 100, max: 10, expected: 10},
    {range: 10, max: 2, expected: 5},
    {range: 200, max: 10, expected: 20},
    {range: 190, max: 10, expected: 20},
  ])(
    'should return step $expected for range $range & $max max scales',
    ({range, expected, max}) => {
      expect(findBestScale(range, max)).toBe(expected);
    },
  );
});
describe(getScaleMarkers, () => {
  it.each([
    {min: -9, max: 19, scale: 10, expected: [-10, 0, 10, 20]},
    {min: 0, max: 0, scale: 10, expected: [0]},
    {min: 0, max: 10, scale: 1, expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]},
  ])(
    'should return scale $expected for step $scale in range [$min, $max]',
    ({expected, max, min, scale}) => {
      expect(getScaleMarkers(min, max, scale)).toEqual(expected);
    },
  );
});

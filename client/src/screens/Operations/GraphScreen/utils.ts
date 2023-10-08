import {inspect} from 'util';

import {Temporal} from '@js-temporal/polyfill';
import {line, scaleLinear, scaleTime} from 'd3';
import {useMemo} from 'react';
import {Dimensions} from 'react-native';
import {IterableElement} from 'type-fest';

import {toPlainDate} from '~/helpers/date';
import {TimelineCalculator} from '~/services/TimelineCalculator';

export type DataPoint = {
  date: Date;
  value: number;
  source: TimelineCalculator.ComputedOperationPoint;
};
export type GraphDot = {
  x: number;
  y: number;
  source: TimelineCalculator.ComputedOperationPoint;
};
export type Dims = {width: number; height: number};

const MAX_Y_SCALE_COUNT = 10;
const _getYScales = (
  min: number,
  max: number,
  scaleY: (value: number) => number,
) => {
  const deltaY = max - min;
  const bestScaleY = findBestScale(deltaY, MAX_Y_SCALE_COUNT);
  const scalesY = getScaleMarkers(min, max, bestScaleY).map(value => ({
    y: scaleY(value),
    text: value,
  }));
  return scalesY;
};

const _loopUpToDate = (
  from: Temporal.PlainDate,
  to: Temporal.PlainDate,
  next: (prev: Temporal.PlainDate) => Temporal.PlainDate,
) => {
  const acc: Temporal.PlainDate[] = [from];
  while (Temporal.PlainDate.compare(acc.at(-1)!, to) < 0) {
    acc.push(next(acc.at(-1)!));
  }
  return acc;
};
const _getXScalesDates = (min: Date, max: Date) => {
  const maxDate = toPlainDate(max);
  const minDate = toPlainDate(min);
  const delta = maxDate.since(minDate);
  if (delta.total({unit: 'days', relativeTo: minDate}) < 10) {
    console.log('1 day step');
    return _loopUpToDate(minDate, maxDate, d => d.add({days: 1}));
  }
  if (delta.total({unit: 'days', relativeTo: minDate}) < 30) {
    console.log('5 days step');
    return _loopUpToDate(minDate, maxDate, d => d.add({days: 5}));
  }
  if (delta.total({unit: 'months', relativeTo: minDate}) < 12) {
    console.log('1 month step');
    return _loopUpToDate(minDate, maxDate, d =>
      d.with({day: 1}).add({months: 1}),
    );
  }
  if (delta.total({unit: 'years', relativeTo: minDate}) < 10) {
    console.log('1 year step');
    return _loopUpToDate(minDate, maxDate, d =>
      d.with({day: 1, month: 1}).add({years: 1}),
    );
  }
  throw new Error('Unsupported');
};
const _getXScales = (min: Date, max: Date, scaleX: (value: Date) => number) =>
  _getXScalesDates(min, max).map(d => {
    return {
      text: d.toLocaleString(),
      x: scaleX(
        new Date(
          d.toZonedDateTime(Temporal.Now.timeZoneId()).epochMilliseconds,
        ),
      ),
    };
  });
export const makeGraph = (
  data: DataPoint[],
  dateRange: [Date, Date?] | undefined,
  graphDimensions: Dims,
) => {
  console.log('Graph data', inspect(data, {colors: true}));
  const maxY = Math.max(...data.map(val => val.value), 0);
  const minY = Math.min(...data.map(val => val.value), 0);
  const scaleY = scaleLinear()
    .domain([maxY, minY])
    .range([Y_PADDING, graphDimensions.height - Y_PADDING]);

  const maxX =
    dateRange?.[1] ??
    new Date(Math.max(...data.map(val => val.date.getTime())));
  const minX =
    dateRange?.[0] ??
    new Date(Math.min(...data.map(val => val.date.getTime())));
  const scaleX = scaleTime()
    .domain([minX, maxX])
    .range([LEFT_PADDING, graphDimensions.width]);

  const dots = data.map<GraphDot>(d => ({
    x: scaleX(d.date),
    y: scaleY(d.value),
    source: d.source,
  }));
  const curvedLine = line<IterableElement<typeof dots>>()
    .x(d => d.x)
    .y(d => d.y)(dots);

  return {
    max: maxY,
    min: minY,
    curve: curvedLine,
    dots,
    scales: {
      x: _getXScales(minX, maxX, scaleX),
      y: _getYScales(minY, maxY, scaleY),
    },
    mostRecent: data[data.length - 1].value,
  };
};

export type GraphData = ReturnType<typeof makeGraph>;

export const useGraphDimensions = () => {
  const {width} = Dimensions.get('screen');

  const card = {width: width - 20, height: 325};
  const _dimensions = {card, graph: {width: card.width - 60, height: 200}};

  return useMemo(
    () => ({
      card: {
        width: _dimensions.card.width,
        height: _dimensions.card.height,
      } satisfies Dims,
      graph: {
        width: _dimensions.graph.width,
        height: _dimensions.graph.height,
      } satisfies Dims,
    }),
    [
      _dimensions.card.width,
      _dimensions.card.height,
      _dimensions.graph.width,
      _dimensions.graph.height,
    ],
  );
};
export const Y_PADDING = 10;
export const LEFT_PADDING = 30;

export const findBestScale = (range: number, maxScale: number) => {
  const steps = [1, 2, 5];
  let factor = 1;
  do {
    for (const step of steps) {
      const totalStep = step * factor;
      if (range / totalStep <= maxScale) {
        return totalStep;
      }
    }
    factor *= 10;
  } while (true);
};

export const getScaleMarkers = (min: number, max: number, scale: number) => {
  const returnArr: [number, ...number[]] = [Math.floor(min / scale) * scale];
  while (returnArr.at(-1)! < max) {
    returnArr.push(returnArr.at(-1)! + scale);
  }
  return returnArr;
};

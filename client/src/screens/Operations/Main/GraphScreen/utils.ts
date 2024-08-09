import {Temporal} from '@js-temporal/polyfill';
import {area, line, scaleLinear, scaleTime} from 'd3';
import {isNotNil} from 'ramda';
import {useMemo} from 'react';
import {Dimensions} from 'react-native';
import {IterableElement} from 'type-fest';

import {toPlainDate} from '~/helpers/date';
import {TimelineCalculator} from '~/services/TimelineCalculator';

export type DataPoint = {
  date: Date;
  value: {min: number; max: number; sum: number};
  checkpointValue?: number;
  source: TimelineCalculator.ComputedOperationPoint;
};
export type GraphDot = {
  x: number;
  y: number;
  yRange: {min: number; max: number};
  isCheckpoint?: boolean;
  isExpandCheckpoint?: boolean;
  source: TimelineCalculator.ComputedOperationPoint;
};
export type Dims = {width: number; height: number};

export const TOP_PADDING = 10;
export const BOTTOM_PADDING = 50;
export const LEFT_PADDING = 30;
export const RIGHT_PADDING = 25;

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
const _getXScalesDates = (
  min: Date,
  max: Date,
): {
  markers: Temporal.PlainDate[];
  format: (date: Temporal.PlainDate) => string;
} => {
  const maxDate = toPlainDate(max);
  const minDate = toPlainDate(min);
  const delta = maxDate.since(minDate);
  if (delta.total({unit: 'days', relativeTo: minDate}) == 0) {
    return {markers: [], format: date => date.day.toString()};
  }
  if (delta.total({unit: 'days', relativeTo: minDate}) < 10) {
    return {
      markers: _loopUpToDate(minDate, maxDate, d => d.add({days: 1})),
      format: date => date.day.toString(),
    };
  }
  if (delta.total({unit: 'days', relativeTo: minDate}) < 30) {
    return {
      markers: _loopUpToDate(minDate, maxDate, d => d.add({days: 5})),
      format: date => `${date.month}/${date.day}`,
    };
  }
  if (delta.total({unit: 'months', relativeTo: minDate}) < 15) {
    return {
      markers: _loopUpToDate(minDate, maxDate, d =>
        d.with({day: 1}).add({months: 1}),
      ),
      format: date =>
        `${date.day}/${date.month}/${date.year.toString().slice(-2)}`,
    };
  }
  if (delta.total({unit: 'years', relativeTo: minDate}) < 10) {
    return {
      markers: _loopUpToDate(minDate, maxDate, d =>
        d.with({day: 1, month: 1}).add({years: 1}),
      ),
      format: date =>
        `${date.day}/${date.month}/${date.year.toString().slice(-2)}`,
    };
  }
  throw new Error('Unsupported');
};
const _getXScales = (min: Date, max: Date, scaleX: (value: Date) => number) => {
  const {format, markers} = _getXScalesDates(min, max);
  return markers.map(d => {
    return {
      text: format(d),
      x: scaleX(
        new Date(
          d.toZonedDateTime(Temporal.Now.timeZoneId()).epochMilliseconds,
        ),
      ),
    };
  });
};
export const makeGraph = (
  data: DataPoint[],
  dateRange: [Date, Date?] | undefined,
  graphDimensions: Dims,
) => {
  const maxY = Math.max(
    ...data.map(val => val.checkpointValue ?? val.value.max),
    0,
  );
  const minY = Math.min(
    ...data.map(val => val.checkpointValue ?? val.value.min),
    0,
  );
  const scaleY = scaleLinear()
    .domain([maxY, minY])
    .range([
      TOP_PADDING,
      graphDimensions.height - (TOP_PADDING + BOTTOM_PADDING),
    ]);

  const maxX =
    dateRange?.[1] ??
    new Date(Math.max(...data.map(val => val.date.getTime())));
  const minX =
    dateRange?.[0] ??
    new Date(Math.min(...data.map(val => val.date.getTime())));
  const scaleX = scaleTime()
    .domain([minX, maxX])
    .range([LEFT_PADDING, graphDimensions.width - RIGHT_PADDING]);

  const dots = data.flatMap<GraphDot>(d =>
    [
      {
        x: scaleX(d.date),
        y: scaleY(d.value.sum),
        yRange: {min: scaleY(d.value.min), max: scaleY(d.value.max)},
        isCheckpoint: isNotNil(d.checkpointValue),
        source: d.source,
      },
      d.checkpointValue
        ? {
            x: scaleX(d.date),
            y: scaleY(d.checkpointValue),
            yRange: {
              min: scaleY(d.checkpointValue),
              max: scaleY(d.checkpointValue),
            },
            source: d.source,
          }
        : null,
    ].filter(isNotNil),
  );
  const nonCheckpoints = dots.filter(d => d.isCheckpoint !== true);

  return {
    y: {
      zero: scaleY(0),
      max: maxY,
      min: minY,
    },
    curve: line<IterableElement<typeof dots>>()
      .x(d => d.x)
      .y(d => d.y)(nonCheckpoints),
    area: area<IterableElement<typeof dots>>(
      d => d.x,
      scaleY(0),
      d => d.y,
    )(nonCheckpoints),
    dots,
    scales: {
      x: _getXScales(minX, maxX, scaleX),
      y: _getYScales(minY, maxY, scaleY),
    },
    mostRecent: data.at(-1)?.value.sum,
  };
};

export type GraphData = ReturnType<typeof makeGraph>;

export const useGraphDimensions = () => {
  const {width} = Dimensions.get('screen');

  const card = {width: width - 20, height: 325};
  const _dimensions = {
    card,
    graph: {
      width: card.width - 10,
      height: 325 - (TOP_PADDING + BOTTOM_PADDING),
    },
  };

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

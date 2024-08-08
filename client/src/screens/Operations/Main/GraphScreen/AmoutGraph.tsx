import {Operation} from '@budget-planner/models';
import {color} from 'd3';
import {clamp, uniq} from 'ramda';
import React, {useMemo} from 'react';
import {StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text,
} from 'react-native-svg';

import {
  BOTTOM_PADDING,
  Dims,
  GraphData,
  GraphDot,
  LEFT_PADDING,
  TOP_PADDING,
} from './utils';

const styles = StyleSheet.create({
  graphChartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const OPERATION_TYPE_COLORS = {
  [Operation.Type.Recurring]: color('#f00'),
  [Operation.Type.OneTime]: color('#0f0'),
  [Operation.Type.Checkpoint]: color('#00f'),
};

function AmountGraph({
  graphData,
  dimensions,
  onDotSelected,
}: {
  graphData: GraphData;
  dimensions: Dims;
  onDotSelected: (dot: GraphDot) => void;
}) {
  const dots = useMemo(
    () =>
      graphData.dots.map(d => {
        const opCount = d.source.operations.length;
        const finalColor = d.source.operations
          .reduce<[number, number, number]>(
            ([r, g, b], op) => {
              const opColor = OPERATION_TYPE_COLORS[op.source.type]!.rgb();
              return [r + opColor.r, g + opColor.g, b + opColor.b];
            },
            [0, 0, 0],
          )
          .map(c => c / opCount)
          .map(clamp(0, 255))
          .map(Math.round)
          .map(c => c.toString(16).padStart(2, '0'))
          .join('');
        return {...d, color: finalColor};
      }),
    [graphData],
  );
  const gradients = uniq(dots.map(d => d.color));
  const elementColor = '#333333';
  const gridLineColor = '#d7d7d7';
  return (
    <Animated.View style={styles.graphChartContainer}>
      <Svg
        width={dimensions.width}
        height={dimensions.height}
        stroke={elementColor}
        strokeWidth={0.2}>
        <Defs>
          <ClipPath id="graph-clip">
            <Rect
              x={LEFT_PADDING}
              y={0}
              height={dimensions.height - (BOTTOM_PADDING + TOP_PADDING)}
              width={dimensions.width - LEFT_PADDING}
            />
          </ClipPath>
          <ClipPath id="positive-clip">
            <Rect
              x={LEFT_PADDING}
              y={0}
              height={graphData.y.zero}
              width={dimensions.width - LEFT_PADDING}
            />
          </ClipPath>
          <ClipPath id="negative-clip">
            <Rect
              x={LEFT_PADDING}
              y={graphData.y.zero}
              height={dimensions.height}
              width={dimensions.width - LEFT_PADDING}
            />
          </ClipPath>
          {gradients.map((c, i) => (
            <RadialGradient
              key={i}
              cx="50%"
              cy="50%"
              r="50%"
              id={`circular-grad-${c}`}>
              <Stop offset="0.3" stopColor={`#${c}`} stopOpacity="1" />
              <Stop offset="0.3" stopColor={`#${c}`} stopOpacity="0.3" />
              <Stop offset="1" stopColor={`#${c}`} stopOpacity="0" />
            </RadialGradient>
          ))}
        </Defs>
        {graphData && (
          <>
            <G id="axis">
              <G id="y-axis">
                {graphData.scales.y.map(({text, y}, i) => {
                  return (
                    <G y={y} x={0} key={i}>
                      <Text
                        y={4}
                        textAnchor="end"
                        x={LEFT_PADDING - 5}
                        fill={elementColor}
                        fillOpacity={1}
                        fontSize={10}>
                        {text}
                      </Text>
                      <Line
                        x1={LEFT_PADDING}
                        y={0}
                        x2={dimensions.width}
                        stroke={gridLineColor}
                        strokeWidth="1"
                      />
                    </G>
                  );
                })}
                <Line
                  x1={LEFT_PADDING}
                  y={graphData.y.zero}
                  x2={dimensions.width}
                  stroke={gridLineColor}
                  strokeWidth="3"
                />
              </G>
              <G id="x-axis">
                {/* Dates */}
                {graphData.scales.x.map(({text, x}, i) => {
                  return (
                    <G y={0} x={x} key={i}>
                      <G y={dimensions.height - (BOTTOM_PADDING + 5)} x={-4}>
                        <Text
                          x={0}
                          y={0}
                          textAnchor="start"
                          transform="rotate(75)"
                          fill={elementColor}
                          fillOpacity={1}
                          fontSize={10}>
                          {text}
                        </Text>
                      </G>
                      <Line
                        x={0}
                        y1={0}
                        y2={dimensions.height - (BOTTOM_PADDING + TOP_PADDING)}
                        stroke={gridLineColor}
                        strokeWidth="1"
                      />
                    </G>
                  );
                })}
              </G>
            </G>

            <G id="inner-graph" clipPath="url(#graph-clip)">
              <Path d={graphData.curve!} strokeWidth="1" fill="none" />
              <Path
                d={graphData.area!}
                fill="#00f"
                fillOpacity={0.2}
                clipPath="url(#positive-clip)"
              />
              <Path
                d={graphData.area!}
                fill="#f00"
                fillOpacity={0.2}
                fillRule="nonzero"
                clipPath="url(#negative-clip)"
              />
              {dots.map((d, i) => {
                return (
                  <Circle
                    key={i}
                    {...d}
                    r={10}
                    fillOpacity={0.8}
                    strokeOpacity={0}
                    fill={`url(#circular-grad-${d.color})`}
                    onPress={() => onDotSelected(d)}
                  />
                );
              })}
            </G>
          </>
        )}
      </Svg>
    </Animated.View>
  );
}

export default AmountGraph;

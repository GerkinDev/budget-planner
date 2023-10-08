import React from 'react';
import Animated from 'react-native-reanimated';
import Svg, {Circle, G, Line, Path, Text} from 'react-native-svg';
import {Dims, GraphData, GraphDot, LEFT_PADDING} from './utils';
import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  graphChartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function AmountGraph({
  graphData,
  dimensions,
  onDotSelected,
}: {
  graphData: GraphData;
  dimensions: Dims;
  onDotSelected: (dot: GraphDot) => void;
}) {
  return (
    <Animated.View style={styles.graphChartContainer}>
      <Svg width={dimensions.width} height={dimensions.height} stroke="#6231ff">
        {graphData && (
          <>
            <G>
              <G>
                {graphData.scales.y.map(({text, y}, i) => {
                  return (
                    <G y={y} x={0} key={i}>
                      <Text y={4} textAnchor="end" x={LEFT_PADDING}>
                        {text}
                      </Text>
                      <Line
                        x1={LEFT_PADDING}
                        y={0}
                        x2={dimensions.width}
                        stroke={'#d7d7d7'}
                        strokeWidth="1"
                      />
                    </G>
                  );
                })}
              </G>
              <G>
                {graphData.scales.x.map(({text, x}, i) => {
                  return (
                    <G y={0} x={x} key={i}>
                      <Text y={dimensions.height} x={4} textAnchor="middle">
                        {text}
                      </Text>
                      <Line
                        x={0}
                        y1={0}
                        y2={dimensions.height}
                        stroke={'#d7d7d7'}
                        strokeWidth="1"
                      />
                    </G>
                  );
                })}
              </G>
              <Path d={graphData.curve!} strokeWidth="2" fill="none" />
              {graphData.dots.map((d, i) => (
                <Circle key={i} {...d} r={2} fill={'#f00'} />
              ))}
              {graphData.dots.map((d, i) => (
                <Circle
                  key={i}
                  {...d}
                  r={10}
                  fillOpacity={0}
                  strokeOpacity={0}
                  onPress={() => onDotSelected(d)}
                />
              ))}
            </G>
          </>
        )}
      </Svg>
    </Animated.View>
  );
}

export default AmountGraph;

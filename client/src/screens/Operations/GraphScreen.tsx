import React, {useEffect, useState} from 'react';
import {Operation} from '@budget-planner/models';
import {ReadonlyDeep} from 'type-fest';
import type {OperationsScreenProps} from '.';
import {Text} from 'react-native-paper';
import {Dimensions, SafeAreaView, StyleSheet, View} from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, {G, Line, Path} from 'react-native-svg';
import {parse, Path as RePath, serialize} from 'react-native-redash';
import {curveBasis, line, scaleLinear, scaleTime} from 'd3';
import {TimelineCalculator} from '~/services/TimelineCalculator';
import {inspect} from 'util';

// From https://betterprogramming.pub/d3-and-react-native-an-essential-guide-to-line-graphs-dc1ce392b440 & https://github.com/friyiajr/D3LineChartSample/blob/solution/src/LineChart.tsx

const {width} = Dimensions.get('screen');

const CARD_WIDTH = width - 20;
const GRAPH_WIDTH = CARD_WIDTH - 60;
const CARD_HEIGHT = 325;
const GRAPH_HEIGHT = 200;

const BOTTOM_PADDING = 20;
const LEFT_PADDING = 0;

const styles = StyleSheet.create({
  graphContainer: {
    flex: 1,
  },
  graphChartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    marginHorizontal: 30,
  },
  graphTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    color: 'black',
  },
  graphPriceText: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  container: {
    flex: 1,
    marginTop: 20,
    alignItems: 'center',
  },
  graphCard: {
    elevation: 5,
    borderRadius: 20,
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export type DataPoint = {
  date: Date;
  value: number;
};

const makeGraph = (data: DataPoint[]) => {
  console.log(data);
  const maxVal = Math.max(...data.map(val => val.value));
  const minVal = Math.min(...data.map(val => val.value));
  const y = scaleLinear().domain([minVal, maxVal]).range([GRAPH_HEIGHT, 35]);

  const maxDate = new Date(Math.max(...data.map(val => val.date.getTime())));
  const minDate = new Date(Math.min(...data.map(val => val.date.getTime())));
  const x = scaleTime()
    .domain([minDate, maxDate])
    .range([10, GRAPH_WIDTH - 10]);

  const curvedLine = line<DataPoint>()
    .x(d => x(new Date(d.date)))
    .y(d => y(d.value))(data);
  // .curve(curveBasis)(data);

  return {
    max: maxVal,
    min: minVal,
    curve: parse(curvedLine!),
    mostRecent: data[data.length - 1].value,
  };
};

function OperationsGraphScreen({
  operations,
}: OperationsScreenProps<'Operations>Graph'> & {
  operations: ReadonlyDeep<Operation[]>;
}) {
  const [graphData, setGraphData] = useState<ReturnType<typeof makeGraph>>();
  useEffect(() => {
    const newCalculator = TimelineCalculator.for(operations);
    console.log(
      'Data points',
      inspect(newCalculator.computedDataPoints, {colors: true}),
    );
    setGraphData(
      makeGraph(
        newCalculator.computedDataPoints.map(dp => ({
          date: dp.date,
          value: dp.actual ?? dp.expected,
        })),
      ),
    );
  }, [operations]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={styles.graphCard}>
        <SafeAreaView style={styles.graphContainer}>
          <View style={styles.graphTitleContainer}>
            <Text style={styles.graphTitleText}>FACEBOOK</Text>
            <Text style={styles.graphTitleText}>0</Text>
          </View>
          <Animated.View style={styles.graphChartContainer}>
            <Svg width={width} height={GRAPH_HEIGHT} stroke="#6231ff">
              <G y={-BOTTOM_PADDING}>
                <Line
                  x1={LEFT_PADDING}
                  y1={GRAPH_HEIGHT}
                  x2={width}
                  y2={GRAPH_HEIGHT}
                  stroke={'#d7d7d7'}
                  strokeWidth="1"
                />
                <Line
                  x1={LEFT_PADDING}
                  y1={GRAPH_HEIGHT * 0.6}
                  x2={width}
                  y2={GRAPH_HEIGHT * 0.6}
                  stroke={'#d7d7d7'}
                  strokeWidth="1"
                />
                <Line
                  x1={LEFT_PADDING}
                  y1={GRAPH_HEIGHT * 0.2}
                  x2={width}
                  y2={GRAPH_HEIGHT * 0.2}
                  stroke={'#d7d7d7'}
                  strokeWidth="1"
                />
                {graphData && (
                  <Path d={serialize(graphData.curve)} strokeWidth="2" />
                )}
              </G>
            </Svg>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </SafeAreaView>
  );
}

export default OperationsGraphScreen;

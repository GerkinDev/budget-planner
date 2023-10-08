import React, {useEffect, useState} from 'react';
import {Operation} from '@budget-planner/models';
import {ReadonlyDeep} from 'type-fest';
import type {OperationsScreenProps} from '..';
import {Button, Text} from 'react-native-paper';
import {SafeAreaView, StyleSheet, View} from 'react-native';
import Animated from 'react-native-reanimated';
import {TimelineCalculator} from '~/services/TimelineCalculator';
import {inspect} from 'util';
import {GraphData, useGraphDimensions, makeGraph} from './utils';
import AmountGraph from './AmoutGraph';
import {roundDate, toPlainDateString} from '~/helpers/date';
import {DatePickerModal} from 'react-native-paper-dates/lib/module/Date/DatePickerModal';
import assert from 'assert';

// From https://betterprogramming.pub/d3-and-react-native-an-essential-guide-to-line-graphs-dc1ce392b440 & https://github.com/friyiajr/D3LineChartSample/blob/solution/src/LineChart.tsx

const styles = StyleSheet.create({
  graphContainer: {
    flex: 1,
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
    flexDirection: 'column',
    marginTop: 20,
    alignItems: 'center',
  },
  graphCard: {
    elevation: 5,
    borderRadius: 20,
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

function OperationsGraphScreen({
  operations,
}: OperationsScreenProps<'Operations>Graph'> & {
  operations: ReadonlyDeep<Operation[]>;
}) {
  const [graphData, setGraphData] = useState<GraphData>();
  const [dateRange, setDateRange] = useState<[Date, Date]>();
  const [isOpenDate, setIsOpenDate] = useState<boolean>(false);

  const dimensions = useGraphDimensions();
  useEffect(() => {
    const newCalculator = TimelineCalculator.for(operations);
    const dataPoints = newCalculator.forRange(dateRange?.[0], dateRange?.[1]);
    setGraphData(
      makeGraph(
        dataPoints.map(dp => ({
          date: dp.date,
          value: dp.actual ?? dp.expected,
        })),
        dateRange,
        dimensions.graph,
      ),
    );
  }, [operations, dimensions, dateRange]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{minHeight: '100%', flex: 1}}>
        <Button onPress={() => setIsOpenDate(true)} mode="contained-tonal">
          {dateRange ? (
            <Text>
              From {toPlainDateString(dateRange[0])} to{' '}
              {toPlainDateString(dateRange[1])}
            </Text>
          ) : (
            <Text style={{fontStyle: 'italic'}}>Automatic</Text>
          )}
        </Button>
        <DatePickerModal
          locale="en"
          mode="range"
          visible={isOpenDate}
          onDismiss={() => setIsOpenDate(false)}
          startDate={dateRange?.[0]}
          endDate={dateRange?.[1]}
          onConfirm={args => {
            assert(args.startDate);
            setIsOpenDate(false);
            setDateRange([
              roundDate(args.startDate),
              args.endDate
                ? roundDate(args.endDate)
                : roundDate(args.startDate),
            ]);
          }}
        />
        <Animated.View style={[styles.graphCard, dimensions.card]}>
          <SafeAreaView style={styles.graphContainer}>
            <View style={styles.graphTitleContainer}>
              <Text style={styles.graphTitleText}>FACEBOOK</Text>
              <Text style={styles.graphTitleText}>0</Text>
            </View>
            {graphData && (
              <AmountGraph
                dimensions={dimensions.graph}
                graphData={graphData}
              />
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

export default OperationsGraphScreen;

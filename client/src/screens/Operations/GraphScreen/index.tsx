import React, {useEffect, useState} from 'react';
import {Operation} from '@budget-planner/models';
import {ReadonlyDeep} from 'type-fest';
import type {OperationsScreenProps} from '..';
import {Button, DataTable, Text} from 'react-native-paper';
import {Dimensions, SafeAreaView, StyleSheet, View} from 'react-native';
import Animated from 'react-native-reanimated';
import {TimelineCalculator} from '~/services/TimelineCalculator';
import {GraphData, useGraphDimensions, makeGraph, GraphDot} from './utils';
import AmountGraph from './AmoutGraph';
import {roundDate, toPlainDateString} from '~/helpers/date';
import {DatePickerModal} from 'react-native-paper-dates/lib/module/Date/DatePickerModal';
import assert from 'assert';
import BPModal from '~/components/BPModal';
import {ScrollView} from 'react-native-gesture-handler';

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
    flexDirection: 'column',
    marginTop: 20,
    alignItems: 'center',
    flexGrow: 1,
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

  dotDetailsTableLabelSpecial: {
    fontWeight: 'bold',
  },
});

function OperationsGraphScreen({
  operations,
}: OperationsScreenProps<'Operations>Graph'> & {
  operations: ReadonlyDeep<Operation[]>;
}) {
  const [graphData, setGraphData] = useState<GraphData>();
  const [dateRange, setDateRange] = useState<[Date, Date?]>([
    roundDate(new Date()),
  ]);
  const [isOpenDate, setIsOpenDate] = useState<boolean>(false);
  const [selected, setSelected] = useState<GraphDot>();

  const dimensions = useGraphDimensions();
  useEffect(() => {
    const newCalculator = TimelineCalculator.for(operations);
    console.log('Date range', dateRange);
    const dataPoints = newCalculator.forRange(dateRange?.[0], dateRange?.[1]);
    setGraphData(
      makeGraph(
        dataPoints.map(dp => ({
          date: dp.date,
          value: dp.actual ?? dp.expected,
          source: dp,
        })),
        dateRange,
        dimensions.graph,
      ),
    );
  }, [operations, dimensions, dateRange]);

  return (
    <>
      <BPModal visible={!!selected} onDismiss={() => setSelected(undefined)}>
        <DataTable
          style={{
            width: Math.min(Dimensions.get('window').width, 300),
            alignSelf: 'flex-start',
          }}>
          <Text>On {selected?.source.date.toDateString()}</Text>
          <DataTable.Header>
            <DataTable.Title>Label</DataTable.Title>
            <DataTable.Title numeric>Amount</DataTable.Title>
          </DataTable.Header>

          {selected?.source.operations.map((op, i) => (
            <DataTable.Row key={i}>
              <DataTable.Cell>
                {op.label ? (
                  op.label
                ) : (
                  <Text style={{fontStyle: 'italic'}}>Unset</Text>
                )}
              </DataTable.Cell>
              <DataTable.Cell numeric>{op.amount}€</DataTable.Cell>
            </DataTable.Row>
          ))}

          <DataTable.Row>
            <DataTable.Cell>
              <Text style={styles.dotDetailsTableLabelSpecial}>
                Delta this day
              </Text>
            </DataTable.Cell>
            <DataTable.Cell numeric>
              {selected?.source.operations.reduce(
                (acc, op) => acc + op.amount,
                0,
              )}
              €
            </DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>
              <Text style={styles.dotDetailsTableLabelSpecial}>Result</Text>
            </DataTable.Cell>
            <DataTable.Cell numeric>
              {selected?.source.actual ?? selected?.source.expected}€
            </DataTable.Cell>
          </DataTable.Row>
        </DataTable>
      </BPModal>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.container}>
          <Button onPress={() => setIsOpenDate(true)} mode="contained-tonal">
            {dateRange ? (
              <Text>
                From {toPlainDateString(dateRange[0])}
                {dateRange[1] && ` to ${toPlainDateString(dateRange[1])}`}
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
            <View style={styles.graphContainer}>
              <View style={styles.graphTitleContainer}>
                <Text style={styles.graphTitleText}>FACEBOOK</Text>
                <Text style={styles.graphTitleText}>0</Text>
              </View>
              {graphData && (
                <AmountGraph
                  dimensions={dimensions.graph}
                  graphData={graphData}
                  onDotSelected={setSelected}
                />
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

export default OperationsGraphScreen;

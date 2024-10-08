import assert from 'assert';

import {Operation} from '@budget-planner/models';
import React, {useEffect, useMemo, useState} from 'react';
import {Dimensions, SafeAreaView, StyleSheet, View} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {Button, DataTable, Text} from 'react-native-paper';
import {DatePickerModal} from 'react-native-paper-dates/lib/module/Date/DatePickerModal';
import Animated from 'react-native-reanimated';
import {ReadonlyDeep} from 'type-fest';

import BPModal from '~/components/BPModal';
import {MaterialIcon} from '~/components/Icons';
import {roundDate, toPlainDateString} from '~/helpers/date';
import {TimelineCalculator} from '~/services/TimelineCalculator';

import AmountGraph, {OPERATION_TYPE_COLORS} from './AmoutGraph';
import {GraphData, useGraphDimensions, makeGraph, GraphDot} from './utils';
import type {OperationsMainScreenProps} from '..';

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
    marginTop: 15,
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

  legendContainer: {
    marginTop: 10,
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  legendItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItemDot: {
    marginRight: 3,
  },
});

function OperationsGraphScreen({
  operations,
}: OperationsMainScreenProps<'Operations>Main>Graph'> & {
  operations: ReadonlyDeep<Operation[]>;
}) {
  const [dateRange, setDateRange] = useState<[Date, Date?]>([
    roundDate(new Date()),
  ]);
  const [isOpenDate, setIsOpenDate] = useState<boolean>(false);
  const [selected, setSelected] = useState<GraphDot>();

  const dimensions = useGraphDimensions();
  const graphData = useMemo(() => {
    const newCalculator = TimelineCalculator.for(operations);
    console.log('Date range', dateRange);
    const dataPoints = newCalculator.forRange(dateRange?.[0], dateRange?.[1]);
    console.log('Will build graph data');
    try {
      const graph = makeGraph(
        dataPoints.map(dp => ({
          date: dp.date,
          value: dp.expected,
          checkpointValue: dp.actual,
          source: dp,
        })),
        dateRange,
        dimensions.graph,
      );
      console.log('Graph data built');
      return graph;
    } catch (error) {
      console.error('Failed to build graph data', error);
      throw error;
    }
  }, [operations, dimensions, dateRange]);
  console.log(graphData);

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
                {op.source.label ? (
                  op.source.label
                ) : (
                  <Text style={{fontStyle: 'italic'}}>Unset</Text>
                )}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {op.source.amount.toFixed(2)}€
              </DataTable.Cell>
            </DataTable.Row>
          ))}

          <DataTable.Row>
            <DataTable.Cell>
              <Text style={styles.dotDetailsTableLabelSpecial}>
                Delta this day
              </Text>
            </DataTable.Cell>
            <DataTable.Cell numeric>
              {selected?.source.operations
                .reduce((acc, op) => acc + op.source.amount, 0)
                .toFixed(2)}
              €
            </DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>
              <Text style={styles.dotDetailsTableLabelSpecial}>Result</Text>
            </DataTable.Cell>
            <DataTable.Cell numeric>
              {(
                selected?.source.expected.sum ?? selected?.source.actual
              )?.toFixed(2)}
              €
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
                <Text style={styles.graphTitleText}>Balance</Text>
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
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <MaterialIcon
                name="circle"
                color={OPERATION_TYPE_COLORS.Checkpoint?.formatHex()}
                style={styles.legendItemDot}
              />
              <Text>Checkpoint</Text>
            </View>
            <View style={styles.legendItem}>
              <MaterialIcon
                name="circle"
                color={OPERATION_TYPE_COLORS.OneTime?.formatHex()}
                style={styles.legendItemDot}
              />
              <Text>One time</Text>
            </View>
            <View style={styles.legendItem}>
              <MaterialIcon
                name="circle"
                color={OPERATION_TYPE_COLORS.Recurring?.formatHex()}
                style={styles.legendItemDot}
              />
              <Text>Recurring</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

export default OperationsGraphScreen;

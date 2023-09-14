/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
} from 'react-native';

import {Operation} from '@budget-planner/models';
import {Entry, ReadonlyDeep} from 'type-fest';
import ThemeView from './ThemeView';
import {RowMap, SwipeListView} from 'react-native-swipe-list-view';
import {buildThemeStylesheet, useThemeBg} from '../hooks/useColorScheme';
import {Colors} from 'react-native/Libraries/NewAppScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 22,
  },
  mainLabel: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
  amountLabelGt0: {
    color: '#00ff00',
  },
  amountLabelLt0: {
    color: '#ff0000',
  },
  amountLabel0: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },

  rowFront: {
    alignItems: 'center',
    borderBottomColor: 'black',
    borderBottomWidth: 0.5,
    justifyContent: 'center',
  },
  rowBack: {
    alignItems: 'stretch',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionButton: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    width: 75,
  },
});
const useThemeStylesheets = buildThemeStylesheet({
  light: {
    editBtn: {
      backgroundColor: 'blue',
    },
    deleteBtn: {
      backgroundColor: 'red',
    },
    btnText: {
      color: Colors.darker,
    },
  },
  dark: {
    editBtn: {},
    deleteBtn: {},
  },
});

function OperationTypeChip({
  operation,
}: {
  operation: ReadonlyDeep<Operation>;
}): JSX.Element {
  switch (operation.type) {
    case Operation.Type.Checkpoint: {
      return <Text>Checkpoint</Text>;
    }
    case Operation.Type.OneTime: {
      return <Text>OneTime</Text>;
    }
    case Operation.Type.Recurring: {
      return (
        <Text>
          Every{' '}
          {operation.periodicity.every > 1
            ? `${operation.periodicity.every} ${operation.periodicity.interval}s`
            : operation.periodicity.interval}
        </Text>
      );
    }
  }
}
const STUB_OPERATIONS = [
  {
    amount: 1000,
    date: new Date(2023, 0, 1),
    label: 'Initial credit',
    type: Operation.Type.Checkpoint,
  },
  {
    amount: -15,
    date: new Date(2023, 0, 1),
    label: 'Phone invoice',
    type: Operation.Type.Recurring,
    periodicity: {every: 1, interval: 'month'},
  },
  {
    amount: -100,
    date: new Date(2023, 0, 10),
    label: 'Pay some fees',
    type: Operation.Type.OneTime,
  },
] satisfies Operation[];

function OperationsList(): JSX.Element {
  const themeStyles = useThemeStylesheets();
  const [operations, setOperations] = useState(STUB_OPERATIONS);
  const [opWithKeys, setOpWithKeys] = useState<Map<string, Operation>>();
  type OpKvp = Entry<typeof opWithKeys>;
  useEffect(() => {
    setOpWithKeys(new Map(operations.map((op, i) => [`${i}`, op])));
  }, [operations]);
  const themeBg = useThemeBg();

  const editItem = console.log.bind(console, 'CLOSE');
  const deleteItem = console.log.bind(console, 'DELETE');
  const onItemOpen = (rowKey: string, map: RowMap<OpKvp>, value: number) => {
    if (value > 0) {
      console.log('Edit', rowKey);
    } else {
      console.log('Remove', rowKey);
      setOperations(actions =>
        actions.filter(action => action !== opWithKeys?.get(rowKey)),
      );
    }
  };
  return (
    <SwipeListView
      data={opWithKeys ? [...opWithKeys.entries()] : []}
      renderItem={({item: [, value]}) => (
        <TouchableHighlight
          onPress={() => console.log('You touched me')}
          style={[themeBg, styles.rowFront]}
          underlayColor={'#fff'}>
          <ThemeView>
            <Text style={styles.mainLabel}>{value.label}</Text>
            <Text
              style={{
                ...styles.amountLabel0,
                ...(value.amount > 0
                  ? styles.amountLabelGt0
                  : value.amount < 0
                  ? styles.amountLabelLt0
                  : {}),
              }}>
              {value.amount.toFixed(2)}€
            </Text>
            <Text style={styles.mainLabel}>
              {value.date.toLocaleDateString()}
            </Text>
            <OperationTypeChip operation={value} />
          </ThemeView>
        </TouchableHighlight>
      )}
      renderHiddenItem={(data, rowMap) => (
        <ThemeView style={styles.rowBack}>
          <TouchableOpacity
            style={[styles.actionButton, themeStyles.editBtn]}
            onPress={() => editItem(rowMap, data.item)}>
            <Text style={themeStyles.btnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, themeStyles.deleteBtn]}
            onPress={() => deleteItem(rowMap, data.item)}>
            <Text style={themeStyles.btnText}>Delete</Text>
          </TouchableOpacity>
        </ThemeView>
      )}
      leftOpenValue={styles.actionButton.width}
      rightOpenValue={-styles.actionButton.width}
      stopLeftSwipe={styles.actionButton.width}
      stopRightSwipe={-styles.actionButton.width}
      previewOpenValue={-40}
      previewOpenDelay={0}
      onRowDidOpen={onItemOpen}
      keyExtractor={([key]) => key}
    />
  );
}

export default OperationsList;

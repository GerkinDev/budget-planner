import assert from 'assert';

import {Operation} from '@budget-planner/models';
import React, {ComponentProps, useEffect, useState} from 'react';

import {StyleSheet, View} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {TouchableHighlight} from 'react-native-gesture-handler';
import {Text} from 'react-native-paper';
import {RowMap, SwipeListView} from 'react-native-swipe-list-view';
import {Entry, ReadonlyDeep} from 'type-fest';

import BPFABContainer from '~/components/BPFABContainer';
import BPModal from '~/components/BPModal';
import {
  FontAwesome6Icon,
  MaterialCommunityIcon,
  iconWrapper,
} from '~/components/Icons';
import ThemeView from '~/components/ThemeView';
import {buildThemeStylesheet, useThemeBg} from '~/hooks/useColorScheme';

import type {OperationsScreenProps} from '.';
import EditOperation from './components/EditOperation';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 22,
  },
  entryText: {
    paddingVertical: 5,
    paddingLeft: 10,
    fontSize: 18,
  },
  amountLabelGt0: {
    color: '#00ff00',
  },
  amountLabelLt0: {
    color: '#ff0000',
  },

  rowFront: {
    alignItems: 'center',
    borderBottomColor: 'black',
    borderBottomWidth: 0.5,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  rowBack: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomColor: '#aaa',
    borderBottomWidth: 1,
  },
  actionButton: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    width: 100,
  },
  operationTypeIcon: {
    width: 50,
    height: 50,
    textAlign: 'center',
  },
});
const useThemeStylesheets = buildThemeStylesheet({
  light: {
    editBtn: {
      color: 'blue',
    },
    deleteBtn: {
      color: 'red',
    },
    btnText: {
      color: Colors.darker,
    },
  },
  dark: {
    editBtn: {
      color: 'blue',
    },
    deleteBtn: {
      color: 'red',
    },
    btnText: {
      color: Colors.darker,
    },
  },
});

function OperationTypeChip({
  operation,
  ...otherProps
}: {
  operation: ReadonlyDeep<Operation>;
} & Omit<ComponentProps<typeof View>, 'children'>): JSX.Element {
  return (
    <View {...otherProps}>
      {(() => {
        switch (operation.type) {
          case Operation.Type.Checkpoint: {
            return (
              <MaterialCommunityIcon
                size={styles.operationTypeIcon.width}
                styles={[styles.operationTypeIcon]}
                name="flag-checkered"
              />
            );
          }
          case Operation.Type.OneTime: {
            return (
              <MaterialCommunityIcon
                size={styles.operationTypeIcon.width}
                styles={[styles.operationTypeIcon]}
                name="checkbook"
              />
            );
          }
          case Operation.Type.Recurring: {
            return (
              <>
                <MaterialCommunityIcon
                  size={styles.operationTypeIcon.width}
                  styles={[styles.operationTypeIcon]}
                  name="repeat-variant"
                />
                <Text {...otherProps} style={styles.operationTypeIcon}>
                  Every{' '}
                  {operation.periodicity.every > 1
                    ? `${operation.periodicity.every} ${operation.periodicity.interval}s`
                    : operation.periodicity.interval}
                </Text>
              </>
            );
          }
        }
      })()}
    </View>
  );
}

function OperationsListScreen({
  operations,
  onChanged,
}: OperationsScreenProps<'Operations>List'> & {
  operations: ReadonlyDeep<Operation[]>;
  onChanged: (operations: ReadonlyDeep<Operation[]>) => void;
}): JSX.Element {
  const [visible, setVisible] = React.useState(false);

  const showModal = () => setVisible(true);
  const hideModal = () => {
    setEditedItem(null);
    setVisible(false);
  };

  const themeStyles = useThemeStylesheets();
  const [opWithKeys, setOpWithKeys] = useState<Map<string, Operation>>();
  type OpKvp = Entry<typeof opWithKeys>;
  useEffect(() => {
    setOpWithKeys(new Map(operations.map((op, i) => [`${i}`, op])));
  }, [operations]);
  const themeBg = useThemeBg();
  const [editedItem, setEditedItem] = useState<Operation | null>(null);

  const editItem = (operation: Operation) => {
    setEditedItem(operation);
    showModal();
  };
  const onItemOpen = (rowKey: string, map: RowMap<OpKvp>, value: number) => {
    assert(rowKey.match(/\d+/));
    const idx = parseInt(rowKey, 10);
    if (value >= 0) {
      const item = operations[idx];
      editItem(item);
    } else {
      onChanged([...operations.slice(0, idx), ...operations.slice(idx + 1)]);
    }
    map[rowKey].closeRow();
  };
  return (
    <>
      <BPModal
        visible={visible}
        onDismiss={hideModal}
        contentContainerStyle={{width: '100%'}}>
        <EditOperation
          edited={editedItem}
          onSubmit={operation => {
            console.log('SUBMIT', operation, editedItem);
            if (editedItem) {
              const idx = operations.findIndex(op => op === editedItem);
              console.log(`Was edit for ${idx}`);
              assert(idx >= 0);
              const newOps = [...operations];
              newOps[idx] = operation;
              onChanged(newOps);
            } else {
              onChanged([...operations, operation]);
            }
            hideModal();
          }}
        />
      </BPModal>
      <BPFABContainer
        fab={{
          icon: iconWrapper(FontAwesome6Icon, {name: 'plus'}),
          label: 'Add',
          onPress: () => {
            console.log('PRESS');
            showModal();
          },
          animateFrom: 'right',
        }}
        container={{
          classType: SwipeListView<OpKvp>,
          props: {
            data: opWithKeys ? [...opWithKeys.entries()] : [],
            renderItem: ({item: [, value]}) => (
              <TouchableHighlight style={[themeBg]} underlayColor={'#fff'}>
                <View style={styles.rowFront}>
                  <OperationTypeChip operation={value} style={{flex: 0}} />
                  <View
                    style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                    {value.label ? (
                      <Text style={[styles.entryText]}>{value.label}</Text>
                    ) : (
                      <Text style={[styles.entryText, {fontStyle: 'italic'}]}>
                        Not set
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.entryText,
                        value.amount > 0
                          ? styles.amountLabelGt0
                          : value.amount < 0
                          ? styles.amountLabelLt0
                          : undefined,
                      ]}>
                      {value.amount.toFixed(2)}€
                    </Text>
                    <Text style={styles.entryText}>
                      {value.date.toLocaleDateString()}
                      {value.type === Operation.Type.Recurring
                        ? value.until
                          ? ` to ${value.until.toLocaleDateString()}`
                          : false
                        : false}
                    </Text>
                  </View>
                </View>
              </TouchableHighlight>
            ),
            renderHiddenItem: () => (
              <ThemeView style={[styles.rowBack, themeBg]}>
                <MaterialCommunityIcon
                  name="pencil"
                  size={styles.actionButton.width / 2}
                  style={[styles.actionButton, themeStyles.editBtn]}
                />

                <MaterialCommunityIcon
                  name="delete"
                  size={styles.actionButton.width / 2}
                  style={[styles.actionButton, themeStyles.deleteBtn]}
                />
              </ThemeView>
            ),
            leftOpenValue: styles.actionButton.width,
            rightOpenValue: -styles.actionButton.width,
            stopLeftSwipe: styles.actionButton.width * 1.5,
            stopRightSwipe: -styles.actionButton.width * 1.5,
            previewOpenValue: -40,
            previewOpenDelay: 0,
            onRowDidOpen: onItemOpen,
            keyExtractor: ([key]) => key,
          },
        }}
      />
    </>
  );
}

export default OperationsListScreen;

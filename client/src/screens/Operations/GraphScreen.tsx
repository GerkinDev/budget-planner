import React from 'react';
import {Operation} from '@budget-planner/models';
import {ReadonlyDeep} from 'type-fest';
import type {OperationsScreenProps} from '.';
import {Text} from 'react-native-paper';

function OperationsGraphScreen({}: OperationsScreenProps<'Operations>Graph'> & {
  operations: ReadonlyDeep<Operation[]>;
}) {
  return <Text>Hello</Text>;
}

export default OperationsGraphScreen;

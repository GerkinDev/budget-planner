import assert from 'assert';

import {Operation} from '@budget-planner/models';
import {mapObjIndexed, omit} from 'ramda';
import React, {useRef, useState} from 'react';
import {SafeAreaView} from 'react-native';
import {Button, SegmentedButtons, Text} from 'react-native-paper';
import {Except} from 'type-fest';

import BPTextInput from '~/components/BPTextInput';
import {FontAwesome6Icon, iconWrapper} from '~/components/Icons';
import {IValidable} from '~/helpers/validation';

import AddOperationOneTime from './OneTime';
import AddOperationRecurring, {
  assertOperationRecurringProps,
} from './Recurring';

const operationTypes = Object.values(Operation.Type);
function assertOperationType(value: unknown): asserts value is Operation.Type {
  return assert(operationTypes.includes(value as any));
}
function assertOperation(value: unknown): asserts value is Operation {
  assert(value && typeof value === 'object');

  assert('date' in value && value.date && value.date instanceof Date);
  assert('amount' in value && typeof value.amount === 'number');
  assert('label' in value && typeof value.label === 'string');

  assert('type' in value);
  assertOperationType(value.type);

  switch (value.type) {
    case Operation.Type.Recurring: {
      assertOperationRecurringProps(value);
    }
  }
}
export type PerTypeOperationProps<TOperation extends Operation = Operation> =
  Except<TOperation, 'label' | 'amount' | 'type'>;

function EditOperation({
  edited,
  onSubmit,
}: {
  edited?: Operation | null;
  onSubmit: (operation: Operation) => void;
}) {
  const labelInputRef = useRef<IValidable>(null);
  const [label, setLabel] = useState<string>(edited?.label ?? '');
  const amountInputRef = useRef<IValidable>(null);
  const [amount, setAmount] = useState<number>(edited?.amount ?? 0);
  const [operationType, setOperationType] = useState<Operation.Type | null>(
    edited?.type ?? null,
  );

  const [operationOther, setOperationOther] = useState<
    Except<Operation, 'label' | 'amount' | 'type'>
  >(edited ? omit(['label', 'amount', 'type'], edited) : {date: new Date()});
  const operationSubFormRef = useRef<IValidable>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const submit = () => {
    const fields = {labelInputRef, amountInputRef, operationSubFormRef};
    const fieldsValidity = mapObjIndexed(
      v => v.current?.validate() ?? false,
      fields,
    );
    const allInputs = Object.values(fieldsValidity).every(v => v);
    if (!allInputs) {
      return;
    }
    assert(operationType);
    const fullOperation = {
      ...operationOther,
      label,
      amount,
      type: operationType,
    };
    assertOperation(fullOperation);
    console.log('Submit', {
      fullOperation,
      fieldsValidity,
      allInputs,
    });
    setIsSubmitting(true);
    onSubmit(fullOperation);
  };
  return (
    <SafeAreaView style={{width: 'auto'}}>
      <BPTextInput
        ref={labelInputRef}
        label={'Label'}
        value={label ?? undefined}
        onChangeText={(valid, text) => {
          setLabel(valid ? text : '');
        }}
        editable={!isSubmitting}
      />
      <BPTextInput
        ref={amountInputRef}
        label={'Amount'}
        value={amount.toString()}
        validate={value => {
          console.log('validate number', value);
          if (!value.match(/^-?([0-9]*[.])?[0-9]+$/)) {
            return ['Invalid number'];
          }
          return [];
        }}
        onChangeText={(valid, text) => {
          setAmount(valid ? parseFloat(text) : 0);
        }}
        editable={!isSubmitting}
        inputMode="numeric"
      />
      <SegmentedButtons
        value={(operationType as string | null) ?? ''}
        onValueChange={v => {
          if (isSubmitting) {
            return;
          }
          assertOperationType(v);
          setOperationType(v);
          setOperationOther({date: new Date()});
        }}
        buttons={Object.values(Operation.Type).map(t => ({
          value: t as string,
          label: t,
        }))}
      />
      {{
        ['']: () => <Text>Please select a type above</Text>,
        [Operation.Type.OneTime]: () => (
          <AddOperationOneTime
            value={operationOther}
            ref={operationSubFormRef}
            onChanged={(valid, value) => {
              if (valid) {
                setOperationOther(value);
              }
            }}
          />
        ),
        [Operation.Type.Checkpoint]: () => (
          <AddOperationOneTime
            value={operationOther}
            ref={operationSubFormRef}
            onChanged={(valid, value) => {
              if (valid) {
                setOperationOther(value);
              }
            }}
          />
        ),
        [Operation.Type.Recurring]: () => (
          <AddOperationRecurring
            value={operationOther}
            ref={operationSubFormRef}
            onChanged={(valid, value) => {
              if (valid) {
                setOperationOther(value);
              }
            }}
          />
        ),
      }[operationType ?? '']()}
      <Button
        icon={iconWrapper(FontAwesome6Icon, {name: 'save'})}
        mode="contained"
        disabled={isSubmitting}
        onPress={submit}>
        Save
      </Button>
    </SafeAreaView>
  );
}

export default EditOperation;

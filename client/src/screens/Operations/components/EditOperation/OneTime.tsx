import React, {Ref, forwardRef, useState} from 'react';
import {IValidable, OnValueChanged} from '~/helpers/validation';
import {useEmitOnChanged, useSubFormRef} from '../../../../hooks/subFormRef';
import {DatePickerModal} from 'react-native-paper-dates/lib/module/Date/DatePickerModal';
import {Button} from 'react-native-paper';
import type {PerTypeOperationProps} from '.';
import assert from 'assert';
import {roundDate, toPlainDateString} from '~/helpers/date';
import {Operation} from '@budget-planner/models';

const AddOperationOneTime = forwardRef(function AddOperationOneTime(
  {
    value,
    onChanged,
  }: {
    value: PerTypeOperationProps;
    onChanged: OnValueChanged<
      PerTypeOperationProps<Operation.OneTime | Operation.Checkpoint>
    >;
  },
  ref: Ref<IValidable>,
) {
  const [isOpenDate, setIsOpenDate] = useState<boolean>(false);
  const [date, setDate] = useState<Date>(value.date);
  useSubFormRef(ref, []);
  useEmitOnChanged(
    ref,
    [date],
    {
      date: date,
    },
    onChanged,
  );

  return (
    <>
      <Button
        onPress={() => setIsOpenDate(true)}
        uppercase={false}
        mode="outlined">
        On {toPlainDateString(date)}
      </Button>
      <DatePickerModal
        locale="en"
        mode="single"
        visible={isOpenDate}
        onDismiss={() => setIsOpenDate(false)}
        date={date}
        onConfirm={args => {
          assert(args.date);
          setIsOpenDate(false);
          setDate(roundDate(args.date));
        }}
      />
    </>
  );
});

export default AddOperationOneTime;

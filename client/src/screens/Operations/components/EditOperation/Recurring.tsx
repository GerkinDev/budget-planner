import React, {Ref, forwardRef, useRef, useState} from 'react';
import {Operation} from '@budget-planner/models';
import BPTextInput from '~/components/BPTextInput';
import DropDown from 'react-native-paper-dropdown';
import {View} from 'react-native';
import {IValidable, OnValueChanged} from '~/helpers/validation';
import assert from 'assert';
import {useEmitOnChanged, useSubFormRef} from '../../../../hooks/subFormRef';
import type {PerTypeOperationProps} from '.';
import {Button} from 'react-native-paper';
import {DatePickerModal} from 'react-native-paper-dates/lib/module/Date/DatePickerModal';
import {toPlainDate} from '~/helpers/date';

const recurringIntervals = [
  {
    label: 'day(s)',
    value: 'day',
  },
  {
    label: 'week(s)',
    value: 'week',
  },
  {
    label: 'month(s)',
    value: 'month',
  },
  {
    label: 'year(s)',
    value: 'year',
  },
];

export function assertOperationRecurringProps(
  value: Record<string | number | symbol, unknown>,
): asserts value is PerTypeOperationProps<Operation.Recurring> {
  assert(
    'periodicity' in value &&
      value.periodicity &&
      typeof value.periodicity === 'object',
  );
  assert(
    'interval' in value.periodicity &&
      recurringIntervals.some(
        i =>
          i.value ===
          (value.periodicity as Record<string | number | symbol, unknown>)
            .interval,
      ),
  );
  assert(
    'every' in value.periodicity &&
      typeof value.periodicity.every === 'number' &&
      value.periodicity.every >= 1,
  );
  assert(
    'until' in value
      ? value.until instanceof Date || value.until === undefined
      : true,
  );
}
const AddOperationRecurring = forwardRef(function AddOperationRecurring(
  {
    value,
    onChanged,
  }: {
    value: PerTypeOperationProps;
    onChanged: OnValueChanged<PerTypeOperationProps<Operation.Recurring>>;
  },
  ref: Ref<IValidable>,
) {
  const [isOpenDate, setIsOpenDate] = useState<boolean>(false);
  const [date, setDate] = useState<[Date, Date]>([
    value.date,
    'until' in value ? value.until ?? value.date : value.date,
  ]);
  const everyInputRef = useRef<IValidable>(null);
  const [every, setEvery] = useState<number>(
    'periodicity' in value ? value.periodicity.every : 1,
  );
  const [interval, setInterval] = useState<
    Operation.Recurring.Periodicity['interval']
  >('periodicity' in value ? value.periodicity.interval : 'day');
  const [showIntervalDropdown, setShowIntervalDropdown] =
    useState<boolean>(false);
  useSubFormRef(ref, [everyInputRef]);
  useEmitOnChanged(
    ref,
    [date, every, interval],
    {
      date: date[0],
      periodicity: {every, interval},
      until: date[0].getTime() === date[1].getTime() ? undefined : date[1],
    },
    onChanged,
  );

  return (
    <>
      <Button
        onPress={() => setIsOpenDate(true)}
        uppercase={false}
        mode="outlined">
        From {toPlainDate(date[0])}{' '}
        {date[0].getTime() === date[1].getTime()
          ? false
          : `to ${toPlainDate(date[1])}`}
      </Button>
      <DatePickerModal
        locale="en"
        mode="range"
        visible={isOpenDate}
        onDismiss={() => setIsOpenDate(false)}
        startDate={date[0]}
        endDate={date[1]}
        onConfirm={args => {
          assert(args.startDate && args.endDate);
          setIsOpenDate(false);
          setDate([args.startDate, args.endDate]);
        }}
      />
      <View style={{flexDirection: 'row'}}>
        <BPTextInput
          style={{flex: 1}}
          mode="outlined"
          label={'Every'}
          inputMode="decimal"
          value={`${every}`}
          validate={text => {
            const periodicityText = parseInt(text, 10);
            if (periodicityText < 0) {
              return ['Value should be positive'];
            }
            if (!Number.isFinite(periodicityText)) {
              return ['Value should be finite'];
            }
            return [];
          }}
          onChangeText={(valid, t) => {
            if (valid) {
              setEvery(parseInt(t, 10));
            }
          }}
          ref={everyInputRef}
        />
        <DropDown
          dropDownStyle={{flex: 0, flexBasis: 'auto'}}
          visible={showIntervalDropdown}
          onDismiss={() => setShowIntervalDropdown(false)}
          showDropDown={() => setShowIntervalDropdown(true)}
          setValue={intervalValue => {
            assert(
              recurringIntervals.some(i => i.value === intervalValue),
              `Interval ${intervalValue} not valid`,
            );
            setInterval(intervalValue);
          }}
          value={interval}
          label="period"
          list={recurringIntervals}
        />
      </View>
    </>
  );
});

export default AddOperationRecurring;

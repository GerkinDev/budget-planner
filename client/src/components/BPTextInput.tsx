import {always} from 'ramda';
import React, {
  ComponentProps,
  Ref,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import {Text, TextInput} from 'react-native-paper';
import {useBPForeignInteractionManager} from './BPForeignInteractionManager';
import {Except} from 'type-fest';
import {View} from 'react-native';
import {IValidable, OnValueChanged} from '~/helpers/validation';

enum TouchState {
  Pristine = 'Pristine',
  Focused = 'Focused',
  Blurred = 'Blurred',
  Editing = 'Editing',
}

const BPTextInput = forwardRef(function BPTextInput(
  {
    validate = () => [],
    onChangeText = always(undefined),
    label,
    value: baseValue = '',
    ...other
  }: {
    validate?: (text: string) => string[];
    onChangeText?: OnValueChanged<string>;
  } & Except<ComponentProps<typeof TextInput>, 'error' | 'onChangeText'>,
  ref: Ref<IValidable>,
) {
  const [value, setValue] = useState(baseValue);
  const [errors, setErrors] = useState<string[]>([]);
  const [prevErrors, setPrevErrors] = useState<string[]>([]);
  const [touchState, setTouchState] = useState(TouchState.Pristine);
  useBPForeignInteractionManager(
    () => {
      if (
        touchState === TouchState.Focused ||
        touchState === TouchState.Editing
      ) {
        console.log('NOW BLURRED');
        setTouchState(TouchState.Blurred);
        setPrevErrors(errors);
      }
    },
    [touchState],
    false,
  );
  useImperativeHandle(
    ref,
    () => {
      return {
        validate() {
          const newErrors = validate(value);
          setTouchState(TouchState.Blurred);
          setErrors(newErrors);
          return newErrors.length === 0;
        },
      };
    },
    [validate, value],
  );

  const shownErrors = {
    [TouchState.Pristine]: [],
    [TouchState.Blurred]: errors,
    [TouchState.Focused]: prevErrors,
    [TouchState.Editing]: prevErrors,
  }[touchState];
  return (
    <View style={[{flexDirection: 'column'}, other.style]}>
      <TextInput
        {...other}
        label={label}
        value={value}
        onChangeText={text => {
          setValue(text);
          setTouchState(TouchState.Editing);
          const newErrors = validate(text);
          setErrors(newErrors);
          if (newErrors.length > 0) {
            onChangeText(false, null);
          } else {
            setPrevErrors([]);
            onChangeText(true, text);
          }
        }}
        onFocus={e => {
          setTouchState(TouchState.Focused);
          other.onFocus?.(e);
        }}
        onBlur={e => {
          setTouchState(TouchState.Blurred);
          other.onBlur?.(e);
        }}
        error={shownErrors.length > 0}
      />
      {shownErrors.map(e => (
        <Text style={{maxWidth: '100%'}} key={e}>
          {e}
        </Text>
      ))}
    </View>
  );
});

export default BPTextInput;

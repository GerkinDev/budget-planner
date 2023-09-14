import {always} from 'ramda';
import React, {
  ComponentProps,
  Ref,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {Text, TextInput} from 'react-native-paper';
import ThemeView from './ThemeView';
import {useBPForeignInteractionManager} from './BPForeignInteractionManager';
import {Except} from 'type-fest';

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
    onFocus,
    ...other
  }: {
    validate?: (text: string) => string[];
    onChangeText?: (
      ...args: [valid: true, text: string] | [valid: false, text: null]
    ) => void;
  } & Except<ComponentProps<typeof TextInput>, 'error' | 'onChangeText'>,
  ref: Ref<{validate(): boolean}>,
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
    <ThemeView>
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
          onFocus?.(e);
        }}
        error={shownErrors.length > 0}
      />
      {shownErrors.map(e => (
        <Text>{e}</Text>
      ))}
    </ThemeView>
  );
});

export default BPTextInput;

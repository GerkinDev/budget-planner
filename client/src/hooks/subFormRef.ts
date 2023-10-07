import assert from 'assert';
import {Ref, useEffect, useImperativeHandle} from 'react';
import {IValidable, OnValueChanged} from '~/helpers/validation';

export const useSubFormRef = (
  ref: Ref<IValidable>,
  subfields: Ref<IValidable>[],
) => {
  useImperativeHandle(
    ref,
    () => {
      return {
        validate() {
          return subfields.every(field =>
            field === null
              ? false
              : 'current' in field
              ? field.current?.validate() ?? false
              : assert.fail('UNSUPPORTED'),
          );
        },
      };
    },
    subfields,
  );
};

export const useEmitOnChanged = <T>(
  ref: Ref<IValidable>,
  props: unknown[],
  value: T,
  onChanged: OnValueChanged<T>,
) =>
  useEffect(() => {
    if (ref === null) {
      return onChanged(false, null);
    } else if ('current' in ref) {
      if (ref.current?.validate() ?? false) {
        return onChanged(true, value);
      } else {
        return onChanged(false, null);
      }
    }
    assert.fail('UNSUPPORTED');
  }, props);

export interface IValidable {
  validate(): boolean;
}

export type OnValueChanged<T> = (
  ...args: [valid: true, value: T] | [valid: false, value: null]
) => void;

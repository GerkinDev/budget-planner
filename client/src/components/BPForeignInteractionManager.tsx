import assert from 'assert';
import React, {
  DependencyList,
  PropsWithChildren,
  Ref,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import {StyleProp, StyleSheet, TouchableOpacity, ViewStyle} from 'react-native';

const stylesheet = StyleSheet.create({
  baseFull: {
    display: 'flex',
    flex: 1,
    flexBasis: '100%',
    width: '100%',
    height: '100%',
  },
});
const BPForeignInteractionManager = forwardRef(
  function BPForeignInteractionManager(
    {
      styles,
      children,
      ...other
    }: PropsWithChildren<{styles?: StyleProp<ViewStyle>; testID?: string}>,
    ref: Ref<{triggerOut: () => void}>,
  ) {
    const touchCatchers = useMemo(() => new Set<() => void>(), []);
    useImperativeHandle(
      ref,
      () => {
        return {
          triggerOut() {
            console.log('Trigger out');
            touchCatchers.forEach(c => c());
          },
        };
      },
      [touchCatchers],
    );
    return (
      <TouchableOpacity
        {...other}
        style={[stylesheet.baseFull, styles]}
        onPress={() => {
          console.log('Touch out');
          touchCatchers.forEach(c => c());
        }}
        activeOpacity={1}>
        <BPForeignInteractionManagerContext.Provider value={touchCatchers}>
          {children}
        </BPForeignInteractionManagerContext.Provider>
      </TouchableOpacity>
    );
  },
);
const BPForeignInteractionManagerContext = createContext<
  Set<() => void> | undefined
>(undefined);

export const useBPForeignInteractionManager = (
  callback: () => void,
  deps: DependencyList,
  required = true,
) => {
  const touchCatchers = useContext(BPForeignInteractionManagerContext);
  assert(
    touchCatchers || !required,
    `Missing ${BPForeignInteractionManager.name} context`,
  );
  const cbMemo = useCallback(callback, deps);
  useEffect(() => {
    if (!touchCatchers) {
      return;
    }
    touchCatchers.add(cbMemo);
    return () => {
      touchCatchers.delete(cbMemo);
    };
  }, [cbMemo, touchCatchers]);
  return () => {
    touchCatchers?.forEach(c => c());
  };
};

export default BPForeignInteractionManager;

import React, {ComponentProps, ComponentType} from 'react';

export {default as FontAwesome6Icon} from '@expo/vector-icons/FontAwesome';
export {default as MaterialIcon} from '@expo/vector-icons/MaterialIcons';
export {default as MaterialCommunityIcon} from '@expo/vector-icons/MaterialCommunityIcons';

export const iconWrapper =
  <T extends ComponentType<any>>(Icon: T, baseProps: ComponentProps<T>) =>
  (props: Partial<ComponentProps<T>>) => (
    <Icon {...({...baseProps, ...props} as any)} />
  );

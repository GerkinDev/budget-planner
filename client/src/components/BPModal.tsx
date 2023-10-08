import React, {ComponentProps} from 'react';
import {Modal, Portal} from 'react-native-paper';
import {useThemeBg} from '~/hooks/useColorScheme';

function BPModal(props: ComponentProps<typeof Modal>) {
  return (
    <Portal>
      <Modal
        {...props}
        style={[{margin: 10}, props.style]}
        contentContainerStyle={[
          {
            ...useThemeBg(),
            padding: 20,
            width: 'auto',
            alignSelf: 'center',
            display: 'flex',
            flexDirection: 'column',
          } as const,
          props.contentContainerStyle,
        ]}
      />
    </Portal>
  );
}

export default BPModal;

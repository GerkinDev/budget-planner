import React, {ComponentRef, RefAttributes, useRef} from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import BPTextInput from '~/components/BPTextInput';
import BPForeignInteractionManager from '~/components/BPForeignInteractionManager';
import {FontAwesome6Icon} from '~/components/Icons';
import ThemeView from '~/components/ThemeView';
import {Datastore} from '~/services/Datastore';
import type {HomeScreenProps} from './Drawer';

const styles = StyleSheet.create({
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

function AddProfileScreen({
  navigation,
}: HomeScreenProps<'Home>AddProfile'>): JSX.Element {
  const profileInputRef = useRef<ComponentRef<typeof BPTextInput>>(null);
  const foreignInteractionManagerRef =
    useRef<ComponentRef<typeof BPForeignInteractionManager>>(null);
  const [name, setName] = React.useState('');
  const [isDefault, setIsDefault] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const submit = () => {
    const nameValid = profileInputRef.current?.validate() ?? false;
    console.log('Submit', {name, isDefault, nameValid});
    if (!nameValid) {
      return;
    }
    setIsSaving(true);
    new Datastore().createProfile(name, isDefault).then(() => {
      navigation.goBack();
    });
  };

  return isSaving ? (
    <ActivityIndicator animating={true} />
  ) : (
    <SafeAreaView>
      <BPForeignInteractionManager ref={foreignInteractionManagerRef}>
        <BPTextInput
          label="Profile name"
          value={name}
          validate={text => {
            if (text.length < 3) {
              return ['Name too short'];
            }
            return [];
          }}
          onChangeText={(valid, t) => {
            if (valid) {
              setName(t);
            }
          }}
          ref={profileInputRef}
        />
        <ThemeView style={styles.switchContainer}>
          <Text>Set as default</Text>
          <Switch
            value={isDefault}
            onValueChange={v => {
              console.log('toggle default', {v, isDefault});
              foreignInteractionManagerRef.current?.triggerOut();
              return setIsDefault(!isDefault);
            }}
          />
        </ThemeView>
        <Button
          icon={props => <FontAwesome6Icon {...props} name="save" />}
          mode="contained"
          disabled={isSaving}
          onPress={submit}>
          Save
        </Button>
      </BPForeignInteractionManager>
    </SafeAreaView>
  );
}
export default AddProfileScreen;

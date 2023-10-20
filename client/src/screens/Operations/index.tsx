import {
  DrawerScreenProps,
  createDrawerNavigator,
} from '@react-navigation/drawer';
import {CompositeScreenProps} from '@react-navigation/native';
import React from 'react';
import {TouchableOpacity} from 'react-native';

import {IconButton} from 'react-native-paper';

import {FontAwesome6Icon} from '~/components/Icons';
import type {RootStackParamsList, RootStackScreenProps} from '~/Navigation';

import AddProfileScreen from './AddProfileScreen';
import OperationsScreen from './Main';
import ProfilesScreen from './ProfilesScreen';

export type OperationsParamsList = {
  'Operations>Main': undefined;
  'Operations>Profiles': undefined;
  'Operations>AddProfile': undefined;
};

export type OperationsScreenProps<T extends keyof OperationsParamsList> =
  CompositeScreenProps<
    DrawerScreenProps<OperationsParamsList, T>,
    RootStackScreenProps<keyof RootStackParamsList>
  >;
const HomeDrawerNavigator = createDrawerNavigator<OperationsParamsList>();
export const HomeDrawer = ({}: RootStackScreenProps<'Operations'>) => {
  return (
    <HomeDrawerNavigator.Navigator
      backBehavior="order"
      screenOptions={({
        navigation,
      }: {
        navigation: OperationsScreenProps<
          keyof OperationsParamsList
        >['navigation'];
      }) => ({
        title: 'Home',
        drawerPosition: 'right',
        headerRight: () => (
          <IconButton icon={'cog'} onPress={() => navigation.toggleDrawer()} />
        ),
        headerLeft: () =>
          navigation.canGoBack() ? (
            <IconButton
              icon={'arrow-left'}
              onPress={() => navigation.goBack()}
            />
          ) : (
            <IconButton />
          ),
      })}>
      <HomeDrawerNavigator.Screen
        options={{title: 'Operations'}}
        name="Operations>Main"
        component={OperationsScreen}
      />
      <HomeDrawerNavigator.Screen
        options={{title: 'Profiles'}}
        name="Operations>Profiles"
        component={ProfilesScreen}
      />
      <HomeDrawerNavigator.Screen
        options={{title: 'Add profile'}}
        name="Operations>AddProfile"
        component={AddProfileScreen}
      />
    </HomeDrawerNavigator.Navigator>
  );
};

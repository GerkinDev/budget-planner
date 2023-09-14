import React from 'react';
import {
  DrawerScreenProps,
  createDrawerNavigator,
} from '@react-navigation/drawer';
import {TouchableOpacity} from 'react-native';
import {FontAwesome6Icon} from '~/components/Icons';
import AddProfileScreen from './AddProfileScreen';
import HomeScreen from './HomeScreen';
import ProfilesScreen from './ProfilesScreen';
import type {RootStackParamsList, RootStackScreenProps} from '~/Navigation';
import {CompositeScreenProps} from '@react-navigation/native';

type HomeParamsList = {
  'Home>Home': undefined;
  'Home>Profiles': undefined;
  'Home>AddProfile': undefined;
};

export type HomeScreenProps<T extends keyof HomeParamsList> =
  CompositeScreenProps<
    DrawerScreenProps<HomeParamsList, T>,
    RootStackScreenProps<keyof RootStackParamsList>
  >;
const HomeDrawerNavigator = createDrawerNavigator<HomeParamsList>();
export const HomeDrawer = () => {
  return (
    <HomeDrawerNavigator.Navigator
      screenOptions={({navigation}) => ({
        title: 'Home',
        drawerPosition: 'right',
        headerRight: () => (
          <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
            <FontAwesome6Icon name="gear" size={20} color={'black'} />
          </TouchableOpacity>
        ),
      })}>
      <HomeDrawerNavigator.Screen
        options={{title: 'Home'}}
        name="Home>Home"
        component={HomeScreen}
      />
      <HomeDrawerNavigator.Screen
        options={{title: 'Profiles'}}
        name="Home>Profiles"
        component={ProfilesScreen}
      />
      <HomeDrawerNavigator.Screen
        options={{title: 'Add profile'}}
        name="Home>AddProfile"
        component={AddProfileScreen}
      />
    </HomeDrawerNavigator.Navigator>
  );
};

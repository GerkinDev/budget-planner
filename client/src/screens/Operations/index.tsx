import React from 'react';
import assert from 'assert';
import {useCallback, useState} from 'react';
import {
  AbstractState,
  AsyncFulfilled,
  AsyncState,
  IfFulfilled,
  IfPending,
  IfRejected,
  useAsync,
} from 'react-async';
import {SafeAreaView} from 'react-native';
import {Text} from 'react-native-paper';
import type {RootStackParamsList, RootStackScreenProps} from '~/Navigation';
import {Datastore} from '~/services/Datastore';
import OperationsListScreen from './ListScreen';
import {ReadonlyDeep} from 'type-fest';
import {inspect} from 'util';
import {Operation, Profile} from '@budget-planner/models';
import {CompositeScreenProps} from '@react-navigation/native';
import {
  createBottomTabNavigator,
  BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';
import OperationsGraphScreen from './GraphScreen';
import {MaterialCommunityIcon, iconWrapper} from '~/components/Icons';

const datastore = new Datastore();

type OperationsParamsList = {
  'Operations>List': undefined;
  'Operations>Graph': undefined;
};

export type OperationsScreenProps<T extends keyof OperationsParamsList> =
  CompositeScreenProps<
    BottomTabScreenProps<OperationsParamsList, T>,
    RootStackScreenProps<keyof RootStackParamsList>
  >;

const Tab = createBottomTabNavigator<OperationsParamsList>();

function WrapWithLoader({
  operationsPromise,
  children,
}: {
  operationsPromise: AsyncState<
    ReadonlyDeep<Profile.Current>,
    AbstractState<ReadonlyDeep<Profile.Current>>
  >;
  children:
    | ((
        data: ReadonlyDeep<Profile.Current>,
        state: AsyncFulfilled<ReadonlyDeep<Profile.Current>>,
      ) => React.ReactNode)
    | React.ReactNode;
}) {
  return (
    <SafeAreaView>
      <IfPending state={operationsPromise}>
        <Text>Loading</Text>
      </IfPending>
      <IfRejected state={operationsPromise}>
        {error => <Text>Something went wrong: {error.message}</Text>}
      </IfRejected>
      <IfFulfilled state={operationsPromise}>
        {(data, state) => {
          console.log('Loaded', inspect(data, {colors: true, depth: 6}));
          return typeof children === 'function'
            ? children(data, state)
            : children;
        }}
      </IfFulfilled>
    </SafeAreaView>
  );
}

function OperationsScreen({}: RootStackScreenProps<'Operations'>) {
  const [currentProfileName, setCurrentProfileName] = useState<string>();
  const profileLoading = useAsync({
    promiseFn: useCallback(async () => {
      const prefs = await datastore.preferences.read();
      const profileName =
        (prefs ? prefs.defaultProfileName : null) ??
        (await datastore.listProfiles())[0]?.name;
      setCurrentProfileName(profileName);
      if (!profileName) {
        setCurrentProfileName('default');
        return {
          name: 'default',
          timelines: [],
        } satisfies ReadonlyDeep<Profile.Current>;
      }
      const profile = await datastore.profile(profileName).read();
      assert(profile);
      return profile;
    }, []),
  });

  const saveOperations = async (
    baseProfile: ReadonlyDeep<Profile.Current>,
    operations: ReadonlyDeep<Operation[]>,
  ) => {
    assert(currentProfileName);
    const newData = {
      ...baseProfile,
      timelines: [
        {
          name: baseProfile.timelines[0]?.name ?? 'default',
          operations,
        },
        ...baseProfile.timelines.slice(1),
      ],
    };
    console.log(
      'Saving',
      inspect(
        {
          currentProfileName,
          newData,
          baseProfile,
          operations,
        },
        {colors: true, depth: 6},
      ),
    );
    try {
      await datastore.profile(currentProfileName).write(newData);
    } finally {
      console.log('Reloading');
      profileLoading.reload();
    }
  };

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Operations>List"
        children={navigationParams => (
          <WrapWithLoader operationsPromise={profileLoading}>
            {data => (
              <OperationsListScreen
                {...navigationParams}
                operations={data.timelines[0]?.operations ?? []}
                onChanged={operations => saveOperations(data, operations)}
              />
            )}
          </WrapWithLoader>
        )}
        options={{
          tabBarIcon: iconWrapper(MaterialCommunityIcon, {
            name: 'playlist-edit',
          }),
          title: 'List',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Operations>Graph"
        children={navigationParams => (
          <WrapWithLoader operationsPromise={profileLoading}>
            {data => (
              <OperationsGraphScreen
                {...navigationParams}
                operations={data.timelines[0]?.operations ?? []}
              />
            )}
          </WrapWithLoader>
        )}
        options={{
          tabBarIcon: iconWrapper(MaterialCommunityIcon, {
            name: 'chart-timeline-variant',
          }),
          title: 'Graph',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}
export default OperationsScreen;

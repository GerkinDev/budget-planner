import assert from 'assert';
import {useCallback, useState} from 'react';
import {IfFulfilled, IfPending, IfRejected, useAsync} from 'react-async';
import {SafeAreaView} from 'react-native';
import React, {Text} from 'react-native-paper';
import type {RootStackScreenProps} from '~/Navigation';
import {Datastore} from '~/services/Datastore';
import ListScreen from './ListScreen';
import {ReadonlyDeep} from 'type-fest';
import {inspect} from 'util';
import {Profile} from '@budget-planner/models';

const datastore = new Datastore();

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
  return (
    <SafeAreaView>
      <IfPending state={profileLoading}>
        <Text>Loading</Text>
      </IfPending>
      <IfRejected state={profileLoading}>
        {error => <Text>Something went wrong: {error.message}</Text>}
      </IfRejected>
      <IfFulfilled state={profileLoading}>
        {data => {
          console.log('Loaded', inspect(data, {colors: true, depth: 6}));
          return (
            <ListScreen
              operations={data.timelines[0]?.operations ?? []}
              onChanged={operations => {
                assert(currentProfileName);
                const newData = {
                  ...data,
                  timelines: [
                    {name: data.timelines[0]?.name ?? 'default', operations},
                    ...data.timelines.slice(1),
                  ],
                };
                console.log(
                  'Saving',
                  inspect(
                    {
                      currentProfileName,
                      newData,
                      data,
                      operations,
                    },
                    {colors: true, depth: 6},
                  ),
                );
                datastore
                  .profile(currentProfileName)
                  .write(newData)
                  .finally(() => {
                    console.log('Reloading');
                    profileLoading.reload();
                  });
              }}
            />
          );
        }}
      </IfFulfilled>
    </SafeAreaView>
  );
}
export default OperationsScreen;

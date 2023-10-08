import React, {useCallback} from 'react';
import {IfFulfilled, IfPending, IfRejected, useAsync} from 'react-async';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {Text, List, Surface, AnimatedFAB, IconButton} from 'react-native-paper';

import {FontAwesome6Icon, iconWrapper} from '~/components/Icons';
import ThemeView from '~/components/ThemeView';
import {Datastore} from '~/services/Datastore';

import type {HomeScreenProps} from './Drawer';

const datastore = new Datastore();

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  fillContainer: {
    flex: 1,
    flexBasis: '100%',
  },
  noProfiles: {
    padding: 8,
    height: 120,
    width: 120,
    flex: 0,
  },
  fabStyle: {
    bottom: 16,
    right: 16,
    position: 'absolute',
  },
});

function ProfilesScreen({
  navigation,
}: HomeScreenProps<'Home>Profiles'>): JSX.Element {
  const profilesLoading = useAsync({
    promiseFn: useCallback(() => {
      console.log('List profiles');
      return datastore.listProfiles();
    }, []),
  });

  const [isFABExtended, setIsFABExtended] = React.useState(true);

  const onScroll = ({nativeEvent}: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollPosition =
      Math.floor(nativeEvent?.contentOffset?.y) ?? 0;

    setIsFABExtended(currentScrollPosition <= 0);
  };
  const setFavorite = async (profile: string) => {
    await datastore.preferences.write({
      ...(await datastore.preferences.read()),
      defaultProfileName: profile,
    });
    profilesLoading.reload();
  };

  return (
    <SafeAreaView style={styles.fillContainer}>
      <IfPending state={profilesLoading}>
        <Text>Loading</Text>
      </IfPending>
      <IfRejected state={profilesLoading}>
        {error => <Text>Something went wrong: {error.message}</Text>}
      </IfRejected>
      <IfFulfilled state={profilesLoading}>
        {data => (
          <>
            {data.length > 0 ? (
              <ScrollView onScroll={onScroll} style={styles.fillContainer}>
                <List.AccordionGroup>
                  {data.map(profile => (
                    <List.Accordion
                      title={profile.name}
                      id={profile.name}
                      key={profile.name}
                      pointerEvents="auto"
                      left={({}) => (
                        <IconButton
                          size={20}
                          style={{
                            marginTop: 0,
                            marginBottom: 0,
                            marginRight: 0,
                          }}
                          // mode="contained-tonal"
                          onPress={() => setFavorite(profile.name)}
                          icon={profile.isDefault ? 'star' : 'star-outline'}
                        />
                      )}>
                      <Text>TODO</Text>
                    </List.Accordion>
                  ))}
                </List.AccordionGroup>
              </ScrollView>
            ) : (
              <ThemeView style={styles.centerContainer}>
                <Surface style={[styles.centerContainer, styles.noProfiles]}>
                  <Text>No profile yet</Text>
                </Surface>
              </ThemeView>
            )}
            <AnimatedFAB
              icon={iconWrapper(FontAwesome6Icon, {name: 'plus'})}
              label={'Add'}
              extended={isFABExtended}
              visible={true}
              onPress={() => {
                navigation.navigate('Home>AddProfile');
              }}
              animateFrom={'right'}
              iconMode={'dynamic'}
              style={styles.fabStyle}
            />
          </>
        )}
      </IfFulfilled>
    </SafeAreaView>
  );
}
export default ProfilesScreen;

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {NavigationContainer, NavigationState} from '@react-navigation/native';

import {RootStackParamsList, Stack} from './Navigation';
import {ActivityIndicator, PaperProvider} from 'react-native-paper';
import {HomeDrawer} from './screens/Home/Drawer';
import {Linking, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OperationsScreen from './screens/Operations';

// const loadProfile = () => new Datastore().loadDefaultProfile()

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';

const initialNavigation = {
  stale: false,
  type: 'stack',
  key: 'stack-JzoVkMiKiov4ynbSgHdCO',
  index: 0,
  routeNames: ['Home', 'Operations'],
  history: [
    {
      type: 'route',
      key: 'Operations-UnWBKmidjKYXQa1atbDn6',
    },
  ],
  routes: [],
} satisfies NavigationState<RootStackParamsList>;
const SWITCH_TO_WIP_SCREEN = false;

function App(): JSX.Element {
  // const profileState = useAsync(loadProfile);

  const [isReady, setIsReady] = useState(
    __DEV__ && SWITCH_TO_WIP_SCREEN ? false : true,
  );
  const [initialState, setInitialState] = useState<
    NavigationState<RootStackParamsList> | undefined
  >(SWITCH_TO_WIP_SCREEN ? initialNavigation : undefined);

  useEffect(() => {
    const restoreState = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (Platform.OS !== 'web' && initialUrl == null) {
          // Only restore state if there's no deep link and we're not on web
          const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
          const state = savedStateString
            ? JSON.parse(savedStateString)
            : undefined;

          if (state !== undefined) {
            setInitialState(state);
          }
        }
      } catch (e) {
        console.error('Error during state loading', e);
      } finally {
        setIsReady(true);
      }
    };

    if (!isReady) {
      restoreState();
    }
  }, [isReady]);

  if (!isReady) {
    return <ActivityIndicator />;
  }

  return (
    <PaperProvider>
      <NavigationContainer
        initialState={initialState}
        onStateChange={state => {
          console.log(JSON.stringify(state, null, 4));
          return AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
        }}>
        <Stack.Navigator>
          <Stack.Screen name="Operations" component={OperationsScreen} />
          <Stack.Screen
            name="Home"
            component={HomeDrawer}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
    // <StatusBar
    //     barStyle={`${useColorScheme()}-content`}
    //     backgroundColor={useThemeBg().backgroundColor}
    //   />
    //   <OperationsList />
    //   <IfPending state={profileState}><Text>Loading</Text></IfPending>
    //       <IfRejected state={profileState}>{error => <Text>Something went wrong: {error.message}</Text>}</IfRejected>
    //       <IfFulfilled state={profileState}>
    //         {data => (
    //           <View>
    //             <Text style={{fontWeight: 'bold'}}>Profile data:</Text>
    //             <Text style={{fontFamily: 'Courier New', }}>{JSON.stringify(data, null, 2)}</Text>
    //           </View>
    //         )}
    //       </IfFulfilled>
  );
}

export default App;

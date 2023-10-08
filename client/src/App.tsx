/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, NavigationState} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {Linking, Platform} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {ActivityIndicator, PaperProvider} from 'react-native-paper';

import {RootStackParamsList, Stack} from './Navigation';
import {HomeDrawer} from './screens/Home/Drawer';
import OperationsScreen from './screens/Operations';

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';

const initialNavigation = {
  stale: false,
  type: 'stack',
  key: 'stack-hexTK_mmoMS1nYwVDs5GO',
  index: 0,
  routeNames: ['Operations', 'Home'],
  routes: [
    {
      key: 'Operations-YNPaCVyABm522yNXUtwkp',
      name: 'Operations',
      state: {
        stale: false,
        type: 'tab',
        key: 'tab-OSKhNn-aKrz5j8McVt95c',
        index: 1,
        routeNames: ['Operations>List', 'Operations>Graph'],
        history: [
          {
            type: 'route',
            key: 'Operations>List-QDHgP7EEbZZopKUAh2sVJ',
          },
          {
            type: 'route',
            key: 'Operations>Graph-LC0EZfZ3EHSTWwWri2c54',
          },
        ],
        routes: [
          {
            name: 'Operations>List',
            key: 'Operations>List-QDHgP7EEbZZopKUAh2sVJ',
          },
          {
            name: 'Operations>Graph',
            key: 'Operations>Graph-LC0EZfZ3EHSTWwWri2c54',
          },
        ],
      },
    },
  ],
} satisfies NavigationState<RootStackParamsList>;
const SWITCH_TO_WIP_SCREEN = true;

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
    <GestureHandlerRootView style={{flex: 1}}>
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
    </GestureHandlerRootView>
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

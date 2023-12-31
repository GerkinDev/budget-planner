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
import {HomeDrawer} from './screens/Operations';

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';

function App(): JSX.Element {
  const [isReady, setIsReady] = useState(__DEV__ ? false : true);
  const [initialState, setInitialState] = useState<
    NavigationState<RootStackParamsList> | undefined
  >(undefined);

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
            <Stack.Screen
              name="Operations"
              component={HomeDrawer}
              options={{
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

export default App;

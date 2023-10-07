import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

export type RootStackParamsList = {
  Home: undefined;
  Operations: undefined;
};
export type RootStackScreenProps<T extends keyof RootStackParamsList> =
  NativeStackScreenProps<RootStackParamsList, T>;

export const Stack = createNativeStackNavigator<RootStackParamsList>();

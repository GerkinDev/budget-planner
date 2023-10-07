import React, {ComponentClass, ComponentProps, PropsWithChildren} from 'react';
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
  View,
} from 'react-native';
import {AnimatedFAB} from 'react-native-paper';

function BPFABContainer<
  TContainer extends ComponentClass<{
    onScroll?: ComponentProps<typeof ScrollView>['onScroll'];
  }> = typeof ScrollView,
>({
  fab: {icon, label, animateFrom, onPress, style},
  children,
  container,
}: PropsWithChildren<{
  fab: Pick<
    ComponentProps<typeof AnimatedFAB>,
    'onPress' | 'label' | 'icon' | 'animateFrom' | 'style'
  >;
  container?: {
    classType: TContainer;
    props: ComponentProps<TContainer>;
  };
}>) {
  const [isFABExtended, setIsFABExtended] = React.useState(true);

  const onScroll = ({nativeEvent}: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollPosition =
      Math.floor(nativeEvent?.contentOffset?.y) ?? 0;

    setIsFABExtended(currentScrollPosition <= 0);
  };
  const {classType: ContainerClass, props: containerProps} = container ?? {
    classType: ScrollView,
    props: {} as ComponentProps<TContainer>,
  };
  if (containerProps.onScroll) {
    const oldScroll = containerProps.onScroll;
    containerProps.onScroll = e => {
      onScroll(e);
      oldScroll(e);
    };
  } else {
    containerProps.onScroll = onScroll;
  }
  return (
    <View style={{minHeight: '100%', flex: 1}}>
      <ContainerClass {...containerProps}>{children}</ContainerClass>

      <AnimatedFAB
        icon={icon}
        label={label}
        extended={isFABExtended}
        visible={true}
        onPress={onPress}
        animateFrom={animateFrom}
        iconMode={'dynamic'}
        style={[{bottom: 16, right: 16, position: 'absolute'}, style]}
      />
    </View>
  );
}
export default BPFABContainer;

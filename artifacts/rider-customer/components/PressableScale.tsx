import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  PressableProps,
  ViewStyle,
} from "react-native";

type Props = PressableProps & {
  scaleTo?: number;
  style?: ViewStyle | ViewStyle[];
};

export function PressableScale({
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  style,
  children,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        Animated.spring(scale, {
          toValue: scaleTo,
          useNativeDriver: true,
          speed: 40,
          bounciness: 0,
        }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 6,
        }).start();
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style as ViewStyle]}>
        {children as React.ReactNode}
      </Animated.View>
    </Pressable>
  );
}

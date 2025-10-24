import React from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';

export default function CustomSlider({
  style,
  minimumValue = 0,
  maximumValue = 1,
  value = 0,
  onValueChange,
  onSlidingComplete,
  minimumTrackTintColor = '#007AFF',
  maximumTrackTintColor = '#d3d3d3',
  thumbTintColor = '#007AFF',
}) {
  const [sliderWidth, setSliderWidth] = React.useState(0);
  const [sliding, setSliding] = React.useState(false);

  const normalizedValue = React.useMemo(() => {
    const range = maximumValue - minimumValue;
    if (range === 0) return 0;
    return ((value - minimumValue) / range) * 100;
  }, [value, minimumValue, maximumValue]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setSliding(true);
        handlePanResponderMove(evt);
      },
      onPanResponderMove: (evt) => {
        handlePanResponderMove(evt);
      },
      onPanResponderRelease: (evt) => {
        handlePanResponderMove(evt);
        setSliding(false);
        if (onSlidingComplete) {
          const newValue = calculateValue(evt.nativeEvent.locationX);
          onSlidingComplete(newValue);
        }
      },
    })
  ).current;

  const handlePanResponderMove = (evt) => {
    if (sliderWidth > 0 && onValueChange) {
      const newValue = calculateValue(evt.nativeEvent.locationX);
      onValueChange(newValue);
    }
  };

  const calculateValue = (locationX) => {
    const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
    const range = maximumValue - minimumValue;
    return minimumValue + percentage * range;
  };

  const handleLayout = (event) => {
    setSliderWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      style={[styles.container, style]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* Track background */}
      <View style={[styles.track, { backgroundColor: maximumTrackTintColor }]} />
      
      {/* Track progress */}
      <View
        style={[
          styles.trackProgress,
          {
            width: `${normalizedValue}%`,
            backgroundColor: minimumTrackTintColor,
          },
        ]}
      />
      
      {/* Thumb */}
      <View
        style={[
          styles.thumb,
          {
            left: `${normalizedValue}%`,
            backgroundColor: thumbTintColor,
            transform: [{ scale: sliding ? 1.2 : 1 }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  trackProgress: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

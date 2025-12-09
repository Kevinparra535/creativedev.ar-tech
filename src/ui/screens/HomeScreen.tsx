import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

export function HomeScreen() {
  return (
    <ScrollView>
      <Text>Hola</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16
  }
});

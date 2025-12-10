import { Button, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

import type { RootStackParamList } from '@/ui/navigation/types';

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <SafeAreaView style={styles.container}>
      <Button title='Go to AR Test' onPress={() => navigation.navigate('ARTest')} />
      <Button
        title='Go to Room Plan Test'
        onPress={() => navigation.navigate('RoomPlanTestScreen')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default HomeScreen;

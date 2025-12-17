import { Button, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

import type { RootStackParamList } from '@/ui/navigation/types';

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <SafeAreaView style={styles.container}>
      <Button
        title='🧪 AR Test (Room Scans + Tools)'
        onPress={() => navigation.navigate('ARTest')}
      />
      <Button
        title='Go to Room Plan Test'
        onPress={() => navigation.navigate('RoomPlanTestScreen')}
      />
      <Button
        title='🎯 Auto-Alignment Test (Phase 2)'
        onPress={() => navigation.navigate('AutoAlignmentTest')}
      />
      <Button
        title='🎚️ Manual Alignment (Phase 2.2)'
        onPress={() => navigation.navigate('ManualAlignment')}
      />
      <Button
        title='Wall Anchor System'
        onPress={() => navigation.navigate('ModelPreview')}
      />
      {/* <Button
        title='Guided Walkthrough (New)'
        onPress={() => navigation.navigate('GuidedModelSelect', { mode: 'floor' })}
      />
      <Button
        title='Guided Wall Walkthrough (New)'
        onPress={() => navigation.navigate('GuidedModelSelect', { mode: 'wall' })}
      /> */}
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

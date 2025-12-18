import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ValidationProgressBarProps {
  current: number;
  total: number;
}

export const ValidationProgressBar: React.FC<ValidationProgressBarProps> = ({ current, total }) => {
  const progress = total > 0 ? current / total : 0;
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Paredes confirmadas</Text>
        <Text style={styles.count}>{`${current}/${total}`}</Text>
      </View>
      
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${percentage}%` }]} />
        </View>
      </View>
      
      {progress === 1 ? (
        <View style={styles.completeBadge}>
          <Text style={styles.completeBadgeText}>✓ Listo para confirmar</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff'
  },
  count: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff'
  },
  barContainer: {
    paddingTop: 4
  },
  barBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3
  },
  completeBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)'
  },
  completeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50'
  }
});

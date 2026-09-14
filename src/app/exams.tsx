import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { EvaluationWizard } from '@/components/evaluation/evaluation-wizard';

export default function ExamsScreen() {
  return (
    <View style={styles.container}>
      <EvaluationWizard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

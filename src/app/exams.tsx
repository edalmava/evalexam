import * as React from "react"
import { View, StyleSheet } from "react-native"
import { EvaluationWizard } from "@/components/evaluation/EvaluationWizard"

export default function ExamsScreen() {
  return (
    <View style={styles.container}>
      <EvaluationWizard />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
})

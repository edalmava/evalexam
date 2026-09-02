export interface WeightValidationResult {
  limit: number
  totalWeight: number
  exceeds: boolean
}

export type GradingSystem = "0-to-max" | "1-to-max"

export function getWeightLimit(system: GradingSystem, maxScore: number): number {
  if (maxScore <= 0) {
    throw new Error("La nota máxima debe ser mayor a 0")
  }
  if (system === "0-to-max") {
    return maxScore
  }
  return maxScore - 1
}

export function validateWeights(
  weights: number[],
  system: GradingSystem,
  maxScore: number,
): WeightValidationResult {
  const totalWeight = weights.reduce(
    (sum, weight) => sum + (Number.isFinite(weight) ? weight : 0),
    0,
  )
  const limit = getWeightLimit(system, maxScore)
  return { limit, totalWeight, exceeds: totalWeight > limit }
}

export function getDefaultWeight(
  system: GradingSystem,
  maxScore: number,
  totalQuestions: number,
): number {
  if (maxScore <= 0 || totalQuestions <= 0) {
    return 1
  }
  const perQuestion = (maxScore - (system === "0-to-max" ? 0 : 1)) / totalQuestions
  return Math.round(perQuestion * 100) / 100
}
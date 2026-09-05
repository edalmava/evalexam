import { describe, it, expect, beforeEach } from "vitest"
import calculateScore, {
  CalculateParams,
  CalculateResult,
  adjustCorrectForBlanks,
  getMinimumScore,
  capWeightToMaxScore,
} from "./calculateScore"

describe("calculateScore - RF-2 a RF-5 (fórmulas configurables con maxScore)", () => {
  beforeEach(() => {})

  describe("RF-2: Sistema 0 a maxScore, pesos iguales", () => {
    it("fórmula: (maxScore / totalQuestions) * correct", () => {
      const result = calculateScore({
        system: "0-to-max",
        maxScore: 5,
        totalQuestions: 20,
        correct: 15,
        weights: null,
      })
      // (5 / 20) * 15 = 3.75
      expect(result.score).toBe(3.75)
      expect(result.system).toBe("0-to-max")
      expect(result.maxScore).toBe(5)
    })

    it("con maxScore = 10, total = 20, correct = 15", () => {
      const result = calculateScore({
        system: "0-to-max",
        maxScore: 10,
        totalQuestions: 20,
        correct: 15,
        weights: null,
      })
      // (10 / 20) * 15 = 7.5
      expect(result.score).toBe(7.5)
    })

    it("con maxScore = 20, total = 40, correct = 30", () => {
      const result = calculateScore({
        system: "0-to-max",
        maxScore: 20,
        totalQuestions: 40,
        correct: 30,
        weights: null,
      })
      // (20 / 40) * 30 = 15
      expect(result.score).toBe(15)
    })
  })

  describe("RF-3: Sistema 0 a maxScore, pesos diferentes", () => {
    it("fórmula: multiplica cada pregunta acertada por su peso y suma", () => {
      const result = calculateScore({
        system: "0-to-max",
        maxScore: 5,
        totalQuestions: 5,
        correct: 5,
        weights: [1, 1, 1, 1, 1],
      })
      // Todos con peso 1: suma = 5, no > 5, entonces 5
      expect(result.score).toBe(5)
      expect(result.weightsUsed).toEqual([1, 1, 1, 1, 1])
    })

    it("con pesos diferentes y total excede maxScore", () => {
      const result = calculateScore({
        system: "0-to-max",
        maxScore: 5,
        totalQuestions: 3,
        correct: 3,
        weights: [2, 2, 2],
      })
      // Suma = 6, pero > 5, entonces se queda en 5
      expect(result.score).toBe(5)
    })

    it("con pesos mixto: [1, 2, 3], correct = 2", () => {
      // Las 2 primeras preguntas tienen pesos 1 y 2, suma = 3
      const result = calculateScore({
        system: "0-to-max",
        maxScore: 5,
        totalQuestions: 3,
        correct: 2,
        weights: [1, 2, 3],
      })
      // Suma de pesos de las 2 preguntas correctas = 1 + 2 = 3
      // 3 <= 5, entonces score = 3
      expect(result.score).toBe(3)
    })

    it("con correctPerQuestion suma el peso de CADA pregunta acertada (no solo las primeras)", () => {
      // Pesos [1, 2, 3]; el estudiante acierta las preguntas 0 y 2 (no la 1)
      // Suma correcta = 1 + 3 = 4 (aunque correct = 2 no significa pesos[0]+pesos[1])
      const result = calculateScore({
        system: "0-to-max",
        maxScore: 5,
        totalQuestions: 3,
        correct: 2,
        correctPerQuestion: [true, false, true],
        weights: [1, 2, 3],
      })
      expect(result.score).toBe(4)
    })

    it("con correctPerQuestion y aciertos en las primeras preguntas coincide con el respaldo", () => {
      const result = calculateScore({
        system: "0-to-max",
        maxScore: 5,
        totalQuestions: 3,
        correct: 2,
        correctPerQuestion: [true, true, false],
        weights: [1, 2, 3],
      })
      // pesos[0] + pesos[1] = 1 + 2 = 3
      expect(result.score).toBe(3)
    })
  })

  describe("RF-4: Sistema 1 a maxScore, pesos iguales", () => {
    it("fórmula: ((maxScore - 1) / totalQuestions) * correct + 1", () => {
      const result = calculateScore({
        system: "1-to-max",
        maxScore: 5,
        totalQuestions: 20,
        correct: 15,
        weights: null,
      })
      // ((5 - 1) / 20) * 15 + 1 = (4 / 20) * 15 + 1 = 0.2 * 15 + 1 = 3 + 1 = 4
      expect(result.score).toBe(4)
      expect(result.system).toBe("1-to-max")
    })

    it("con maxScore = 10, total = 20, correct = 15", () => {
      const result = calculateScore({
        system: "1-to-max",
        maxScore: 10,
        totalQuestions: 20,
        correct: 15,
        weights: null,
      })
      // ((10 - 1) / 20) * 15 + 1 = (9 / 20) * 15 + 1 = 0.45 * 15 + 1 = 6.75 + 1 = 7.75
      // Math.max(1, Math.min(10, Math.round(7.75 * 100) / 100)) = 7.75
      expect(result.score).toBe(7.75)
    })

    it("con maxScore = 5, total = 10, correct = 0", () => {
      const result = calculateScore({
        system: "1-to-max",
        maxScore: 5,
        totalQuestions: 10,
        correct: 0,
        weights: null,
      })
      // ((5 - 1) / 10) * 0 + 1 = 0 + 1 = 1
      expect(result.score).toBe(1)
    })
  })

  describe("RF-5: Sistema 1 a maxScore, pesos diferentes", () => {
    it("fórmula: suma pesos de preguntas acertadas, si > (maxScore - 1) reduce a (maxScore - 1), +1 al final", () => {
      const result = calculateScore({
        system: "1-to-max",
        maxScore: 5,
        totalQuestions: 3,
        correct: 3,
        weights: [1, 1, 1],
      })
      // Suma = 3, (maxScore - 1) = 4, 3 no > 4, entonces no reducir
      // +1 al final = 4
      expect(result.score).toBe(4)
    })

    it("cuando suma pasa de (maxScore - 1), se reduce", () => {
      const result = calculateScore({
        system: "1-to-max",
        maxScore: 5,
        totalQuestions: 3,
        correct: 3,
        weights: [2, 2, 2],
      })
      // Suma = 6, (maxScore - 1) = 4, 6 > 4, entonces reducir a 4
      // +1 al final = 5
      expect(result.score).toBe(5)
    })

    it("con maxScore = 10, correct = 3, weights = [2, 3, 4]", () => {
      // Suma = 2 + 3 + 4 = 9
      // (maxScore - 1) = 9, 9 no > 9 (es igual), entonces no reducir
      // +1 al final = 10
      const result = calculateScore({
        system: "1-to-max",
        maxScore: 10,
        totalQuestions: 3,
        correct: 3,
        weights: [2, 3, 4],
      })
      expect(result.score).toBe(10)
    })

    it("edge case: maxScore = 5, correct = 3, weights = [3, 3, 3]", () => {
      // Suma = 9, (maxScore - 1) = 4, 9 > 4, reducir a 4, +1 = 5
      const result = calculateScore({
        system: "1-to-max",
        maxScore: 5,
        totalQuestions: 3,
        correct: 3,
        weights: [3, 3, 3],
      })
      expect(result.score).toBe(5)
    })

    it("con correctPerQuestion suma el peso de CADA pregunta acertada en sistema 1-a-max", () => {
      // maxScore = 5, (maxScore - 1) = 4; pesos [1, 2, 3]
      // El estudiante acierta las preguntas 0 y 2 → suma = 1 + 3 = 4
      // 4 no > 4, entonces no reduce, +1 = 5
      const result = calculateScore({
        system: "1-to-max",
        maxScore: 5,
        totalQuestions: 3,
        correct: 2,
        correctPerQuestion: [true, false, true],
        weights: [1, 2, 3],
      })
      expect(result.score).toBe(5)
    })
  })

  describe("Casos límite", () => {
    describe("adjustCorrectForBlanks", () => {
      it("debe devolver el mismo número de correct si no hay en blanco", () => {
        const result = adjustCorrectForBlanks(5, 10)
        expect(result).toBe(5)
      })

      it("deve devolver 0 si correct es 0", () => {
        const result = adjustCorrectForBlanks(0, 10)
        expect(result).toBe(0)
      })

      it("no debe ser negativo", () => {
        const result = adjustCorrectForBlanks(-1, 10) // caso extremo
        expect(result).toBe(0)
      })
    })

    describe("getMinimumScore", () => {
      it("sistema 0-a-max retorna 0", () => {
        expect(getMinimumScore("0-to-max")).toBe(0)
      })

      it("sistema 1-a-max retorna 1", () => {
        expect(getMinimumScore("1-to-max")).toBe(1)
      })
    })

    describe("capWeightToMaxScore", () => {
      it("cuando peso total excede maxScore, devuelve maxScore", () => {
        expect(capWeightToMaxScore(10, 5)).toBe(5)
      })

      it("cuando peso total es menor a maxScore, devuelve el total", () => {
        expect(capWeightToMaxScore(3, 5)).toBe(3)
      })

      it("cuando peso total equals maxScore, devuelve maxScore", () => {
        expect(capWeightToMaxScore(5, 5)).toBe(5)
      })
    })
  })
})
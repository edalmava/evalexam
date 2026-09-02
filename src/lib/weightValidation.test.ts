import { describe, it, expect } from "vitest"
import { getWeightLimit, validateWeights, getDefaultWeight } from "./weightValidation"

describe("weightValidation - límite del peso total según la fórmula", () => {
  it("sistema 0-a-max: el límite permitido es la nota máxima", () => {
    expect(getWeightLimit("0-to-max", 5)).toBe(5)
    expect(getWeightLimit("0-to-max", 100)).toBe(100)
  })

  it("sistema 1-a-max: el límite permitido es la nota máxima menos 1 (RF-5)", () => {
    expect(getWeightLimit("1-to-max", 5)).toBe(4)
    expect(getWeightLimit("1-to-max", 100)).toBe(99)
  })

  it("lanza error si la nota máxima no es mayor a 0", () => {
    expect(() => getWeightLimit("0-to-max", 0)).toThrow()
    expect(() => getWeightLimit("1-to-max", -1)).toThrow()
  })

  it("no excede cuando el peso total es menor o igual al límite", () => {
    const result = validateWeights([1, 2, 3], "0-to-max", 6)
    expect(result.totalWeight).toBe(6)
    expect(result.exceeds).toBe(false)
  })

  it("excede cuando el peso total supera el límite del sistema 0-a-max", () => {
    const result = validateWeights([2, 2, 2], "0-to-max", 5)
    expect(result.totalWeight).toBe(6)
    expect(result.exceeds).toBe(true)
  })

  it("excede cuando el peso total supera el límite del sistema 1-a-max", () => {
    const result = validateWeights([3, 3, 3], "1-to-max", 5)
    expect(result.totalWeight).toBe(9)
    expect(result.limit).toBe(4)
    expect(result.exceeds).toBe(true)
  })

  it("no excede en el caso justo del sistema 1-a-max (peso total = nota máxima - 1)", () => {
    const result = validateWeights([1, 1, 2], "1-to-max", 5)
    expect(result.totalWeight).toBe(4)
    expect(result.exceeds).toBe(false)
  })

  it("ignora pesos no numéricos al sumar", () => {
    const result = validateWeights([1, NaN, 2], "0-to-max", 5)
    expect(result.totalWeight).toBe(3)
    expect(result.exceeds).toBe(false)
  })
})

describe("weightValidation - peso por defecto por pregunta (fórmula)", () => {
  it("sistema 0-a-max: nota máxima / número de preguntas, redondeado a 2 decimales", () => {
    expect(getDefaultWeight("0-to-max", 5, 2)).toBe(2.5)
    expect(getDefaultWeight("0-to-max", 100, 3)).toBe(33.33)
    expect(getDefaultWeight("0-to-max", 5, 1)).toBe(5)
  })

  it("sistema 1-a-max: (nota máxima - 1) / número de preguntas, redondeado a 2 decimales", () => {
    expect(getDefaultWeight("1-to-max", 5, 2)).toBe(2)
    expect(getDefaultWeight("1-to-max", 10, 4)).toBe(2.25)
    expect(getDefaultWeight("1-to-max", 5, 1)).toBe(4)
  })

  it("devuelve el peso por defecto que hace el peso total igual al límite permitido", () => {
    const weights = Array.from({ length: 4 }, () => getDefaultWeight("1-to-max", 10, 4))
    const result = validateWeights(weights, "1-to-max", 10)
    expect(result.totalWeight).toBe(result.limit)
    expect(result.exceeds).toBe(false)
  })

  it("respalda con 1 si la nota máxima o el número de preguntas no es válido", () => {
    expect(getDefaultWeight("0-to-max", 0, 4)).toBe(1)
    expect(getDefaultWeight("0-to-max", 5, 0)).toBe(1)
  })
})
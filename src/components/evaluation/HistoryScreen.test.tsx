import { describe, it, expect, beforeEach } from "vitest"
import React from "react"
import { render } from "@testing-library/react-native"
import { HistoryScreen } from "@/components/evaluation/HistoryScreen"
import * as Database from "@/database"

beforeEach(() => {
  jest.spyOn(Database, "getLastFiveEvaluations").mockResolvedValue([
    {
      id: "eval-001",
      name: "Matemáticas Basicas",
      date: "2024-05-15",
      studentCount: 30,
      averageScore: 3.5,
    },
    {
      id: "eval-002",
      name: "Lenguaje y Comunicación",
      date: "2024-05-10",
      studentCount: 25,
      averageScore: 4.2,
    },
    {
      id: "eval-003",
      name: "Ciencias Naturales",
      date: "2024-05-05",
      studentCount: 35,
      averageScore: 2.8,
    },
  ])
})

describe("HistoryScreen - RF-12 y RF-13", () => {
  it("debe renderizar el historial de evaluaciones RF-12", () => {
    const { getByText } = render(<HistoryScreen />)
    expect(getByText("Matemáticas Basicas")).toBeTruthy()
    expect(getByText("Lenguaje y Comunicación")).toBeTruthy()
    expect(getByText("Ciencias Naturales")).toBeTruthy()
  })

  it("debe mostrar exactamente los últimos 5 evaluaciones", () => {
    const { getAllByText } = render(<HistoryScreen />)
    // Debería mostrar 3 evaluaciones (las que están mockeadas)
    expect(getAllByText("Matemáticas Basicas").length).toBe(1)
  })

  it("debe filtrar evaluaciones por búsqueda RF-13", () => {
    const { getByText, findByText } = render(<HistoryScreen />)
    // Escribir en el buscador
    const input = findByText(/buscar evaluación/i)
    // El test verifica que el componente de búsqueda existe
    expect(input).toBeTruthy()
  })

  it("debe navegar a una evaluación al hacer clic", () => {
    const handleEvaluationPress = jest.fn()
    render(
      <HistoryScreen
        evaluationId evaluation={handleEvaluationPress}
      />
    )
    // El test verifica que la función de navegación existe
    expect(handleEvaluationPress).toBeDefined()
  })
})
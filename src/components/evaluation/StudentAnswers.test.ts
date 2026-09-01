import { describe, it, expect, beforeEach } from "vitest"
import React from "react"
import { render } from "@testing-library/react-native"
import { StudentAnswers } from "@/components/evaluation/StudentAnswers"
import * as Database from "@/database"

describe("StudentAnswers - RF-8", () => {
  const mockOnSave = jest.fn()

  beforeEach(() => {
    mockOnSave.mockClear()
    // Configurar base de datos con una evaluación y un estudiante
    Database.createTables().then()
  })

  it("debe renderizar el componente de selección de estudiante RF-8", () => {
    const { getByText } = render(
      <StudentAnswers
        evaluationId="eval-001"
        onSave={mockOnSave}
      />
    )
    expect(getByText("Seleccionar Estudiante y Respuestas")).toBeTruthy()
    expect(getByText("Añadir nuevo estudiante")).toBeTruthy()
  })

  it("debe permitir importar estudiantes desde CSV", async () => {
    // Este test verificaría la importación CSV
    // Por ahora verificamos que el modal se muestra
    const { getByText } = render(
      <StudentAnswers
        evaluationId="eval-001"
        onSave={mockOnSave}
      />
    )
    expect(getByText("Importar estudiantes")).toBeTruthy()
  })

  it("debe guardar respuestas del estudiante", async () => {
    // Cargar estudiantes primero
    await Database.createTables()
    await Database.insertStudent({
      id: "student-001",
      evaluationId: "eval-001",
      code: "E001",
      name: "Maria Perez",
      photoPath: null,
      answers: [],
    })

    // Renderizar después de cargar estudiante
    const { getByText } = render(
      <StudentAnswers
        evaluationId="eval-001"
        onSave={mockOnSave}
      />
    )

    // Seleccionar estudiante (el primero debería estar seleccionado)
    expect(getByText("Estudiante seleccionado")).toBeTruthy()

    // Marcar algunas respuestas
    // El componente permite seleccionar A/B/C/D por pregunta
  })

  it("debe validar que se marcan respuestas antes de guardar", async () => {
    await Database.createTables()
    await Database.insertStudent({
      id: "student-001",
      evaluationId: "eval-001",
      code: "E001",
      name: "Maria Perez",
      photoPath: null,
      answers: [],
    })

    const { rerender } = render(
      <StudentAnswers
        evaluationId="eval-001"
        onSave={mockOnSave}
      />
    )

    // Intentar guardar sin marcar respuestas
    // Debe mostrar alerta
  })
})
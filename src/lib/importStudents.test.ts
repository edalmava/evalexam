import { describe, it, expect, beforeEach } from "vitest"
import importStudentsFromCSV, {
  exportStudentsToCSV,
  isValidCSV
} from "./importStudents"

describe("importStudentsFromCSV - RF-7", () => {
  beforeEach(() => {})

  it("debe parsear CSV con formato código, nombre", () => {
    const csv = "E001, Maria Perez\nE002, Juan Gomez\nE003, Carlos Ruiz"
    const students = importStudentsFromCSV(csv)
    
    expect(students).toHaveLength(3)
    expect(students[0].code).toBe("E001")
    expect(students[0].name).toBe("Maria Perez")
    expect(students[1].code).toBe("E002")
    expect(students[1].name).toBe("Juan Gomez")
    expect(students[2].code).toBe("E003")
    expect(students[2].name).toBe("Carlos Ruiz")
  })

  it("debe parsear CSV con un estudiante por línea (solo códigos)", () => {
    const csv = "E001\nE002\nE003"
    const students = importStudentsFromCSV(csv)
    
    expect(students).toHaveLength(3)
    expect(students[0].code).toBe("E001")
    expect(students[1].code).toBe("E002")
    expect(students[2].code).toBe("E003")
  })

  it("debe manejar CSV mixto (algunas con nombre, algunas sin)", () => {
    const csv = "E001, Maria Perez\nE002\nE003, Carlos"
    const students = importStudentsFromCSV(csv)
    
    expect(students).toHaveLength(3)
    expect(students[0].code).toBe("E001")
    expect(students[0].name).toBe("Maria Perez")
    expect(students[1].code).toBe("E002")
    expect(students[1].name).toBe("")
    expect(students[2].code).toBe("E003")
    expect(students[2].name).toBe("Carlos")
  })

  it("debe retornar arreglo vacío para CSV vacío", () => {
    const students = importStudentsFromCSV("")
    expect(students).toEqual([])
  })

  it("debe retornar arreglo vacío para solo espacios", () => {
    const students = importStudentsFromCSV("   \n   \n   ")
    expect(students).toEqual([])
  })

  it("debe validar CSV con isValidCSV", () => {
    expect(isValidCSV("E001, Maria\nE002, Juan")).toBe(true)
    expect(isValidCSV("E001\nE002")).toBe(true)
    expect(isValidCSV("")).toBe(false)
    expect(isValidCSV("   ")).toBe(false)
  })

  it("debe exportar estudiantes a CSV e importarlos nuevamente", () => {
    const students = [
      { id: "1", code: "E001", name: "Maria" },
      { id: "2", code: "E002", name: "Juan" }
    ]
    
    const csv = exportStudentsToCSV(students)
    const imported = importStudentsFromCSV(csv)
    
    expect(imported).toHaveLength(2)
    expect(imported[0].code).toBe("E001")
    expect(imported[0].name).toBe("Maria")
    expect(imported[1].code).toBe("E002")
    expect(imported[1].name).toBe("Juan")
  })
})
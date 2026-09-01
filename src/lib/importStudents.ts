import { Student } from "@/types"

/**
 * Importa estudiantes desde un string CSV con formato código_estudiante, nombre_estudiante
 * o desde líneas individuales (un estudiante por línea).
 *
 * Formatos soportados:
 * - "E001, Maria Perez\nE002, Juan Gomez" (CSV con dos columnas)
 * - "E001\nE002\nE003" (un código por línea)
 * - "E001, Maria Perez\nE002" (CSV mixto)
 *
 * RF-7: El sistema permite importar estudiantes desde un archivo CSV con formato código_estudiante, nombre_estudiante
 * o ingresarlos uno por línea en un área de texto (textarea).
 *
 * @param csvString - String CSV con los datos de los estudiantes
 * @returns Arreglo de objetos Student con id, code y nombre generados
 * @throws Error si el formato es inválido
 */
export function importStudentsFromCSV(csvString: string): Student[] {
  if (!csvString || csvString.trim() === "") {
    return []
  }

  const lines = csvString.split("\n")
  const students: Student[] = []
  const seenCodes = new Set<string>()

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine === "") continue

    // Intentar parsear como CSV: código, nombre
    const commaIndex = trimmedLine.indexOf(",")
    
    if (commaIndex > 0) {
      // Formato CSV: "codigo, nombre"
      const code = trimmedLine.substring(0, commaIndex).trim()
      const name = trimmedLine.substring(commaIndex + 1).trim()

      if (!code) {
        throw new Error(`Línea vacía o sin código: "${trimmedLine}"`)
      }

      if (seenCodes.has(code)) {
        throw new Error(`Código de estudiante duplicado: ${code}`)
      }
      seenCodes.add(code)

      students.push({
        id: Math.random().toString(36).substr(2, 9),
        code,
        name,
      })
    } else {
      // Formato: un código por línea (solo el código, sin nombre)
      // O podría ser un nombre completo sin coma
      // Intentamos determinar si es solo código o nombre con espacios
      if (trimmedLine.match(/^[A-Z0-9]+$/i)) {
        // Parece un código (solo letras y números)
        const code = trimmedLine.trim()
        if (!code || seenCodes.has(code)) {
          throw new Error(`Código duplicado o vacío: "${code}"`)
        }
        seenCodes.add(code)
        students.push({
          id: Math.random().toString(36).substr(2, 9),
          code,
          name: "", // Nombre vacío cuando solo hay código
        })
      } else {
        // Probablemente es un nombre sin coma
        // Tratamos como nombre de estudiante
        const code = Math.random().toString(36).substr(2, 4).toUpperCase()
        // Verificar duplicados generados
        while (seenCodes.has(code)) {
          code = Math.random().toString(36).substr(2, 4).toUpperCase()
        }
        seenCodes.add(code)
        students.push({
          id: Math.random().toString(36).substr(2, 9),
          code,
          name: trimmedLine,
        })
      }
    }
  }

  if (students.length === 0) {
    throw new Error("No se pudieron parsear estudiantes del CSV proporcionado")
  }

  return students
}

/**
 * Formatea un arreglo de estudiantes a string CSV para exportación/guardado
 *
 * @param students - Arreglo de objetos Student
 * @returns String CSV listo para guardar o exportar
 */
export function exportStudentsToCSV(students: Student[]): string {
  return students
    .map((student) => `${student.code},${student.name}`)
    .join("\n")
}

/**
 * Validación simple de formato CSV
 *
 * @param csvString - String a validar
 * @returns true si parece un CSV válido con códigos de estudiantes
 */
export function isValidCSV(csvString: string): boolean {
  if (!csvString || csvString.trim() === "") return false
  
  const lines = csvString.trim().split("\n")
  return lines.some((line) => {
    const trimmed = line.trim()
    return trimmed.includes(",") || (trimmed.length > 0 && trimmed.match(/^[A-Z0-9]+$/i))
  })
}

export default importStudentsFromCSV
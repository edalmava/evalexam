import * as Print from 'expo-print';
import * as Database from '@/database';
import { buildDistribution } from '@/lib/scoreScale';

interface JSONRow {
  evaluation: Record<string, unknown>;
  students: Record<string, unknown>[];
  exportedAt: string;
}

export const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const exportExamToJSON = async (evaluationId: string): Promise<string> => {
  const evaluation = await Database.selectEvaluation(evaluationId);
  if (!evaluation) {
    throw new Error('Evaluación no encontrada');
  }

  const students = await Database.selectStudentsByEvaluation(evaluationId);

  const jsonData: JSONRow = {
    evaluation: {
      id: evaluation.id,
      name: evaluation.name,
      date: evaluation.date,
      academicPeriod: evaluation.academicPeriod,
      totalQuestions: evaluation.totalQuestions,
      gradingSystem: evaluation.gradingSystem,
      maxScore: evaluation.maxScore,
      questionWeights: evaluation.questionWeights ? JSON.parse(evaluation.questionWeights) : [],
      createdAt: evaluation.createdAt,
    },
    students: students.map((student) => ({
      id: student.id,
      code: student.code,
      name: student.name,
      answers: student.answers ? JSON.parse(student.answers) : [],
      score: student.score,
      photoPath: student.photoPath,
    })),
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(jsonData, null, 2);
};

export const buildEvaluationHtml = (
  evaluation: Database.EvaluationRow,
  students: Database.StudentRow[],
): string => {
  const rows = students
    .map((student) => {
      const answers = student.answers ? JSON.parse(student.answers) : [];
      return `
        <tr>
          <td>${escapeHtml(String(student.code))}</td>
          <td>${escapeHtml(String(student.name))}</td>
          <td>${escapeHtml(answers.join(', ') || 'N/A')}</td>
          <td style="text-align:center"><strong>${Number(student.score).toFixed(2)}</strong></td>
        </tr>
      `;
    })
    .join('');

  const distribution = buildDistribution(
    students.map((student) => Number(student.score) || 0),
    String(evaluation.gradingSystem),
    Number(evaluation.maxScore),
  );
  const distributionRows = distribution
    .map(
      ({ band, count }) => `
        <tr>
          <td>${escapeHtml(band.label)}</td>
          <td>${escapeHtml(band.rangeLabel)}</td>
          <td style="text-align:center"><strong>${count}</strong></td>
        </tr>
      `,
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Helvetica, Arial, sans-serif; color: #2d3748; padding: 24px; }
          h1 { text-align: center; font-size: 26px; margin-bottom: 4px; }
          h2 { text-align: center; font-size: 18px; margin-top: 0; color: #718096; }
          .meta { margin: 20px 0; font-size: 13px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #cbd5e0; padding: 8px; font-size: 12px; text-align: left; }
          th { background-color: #e2e8f0; }
          .section-title { font-size: 15px; font-weight: bold; margin-top: 24px; }
        </style>
      </head>
      <body>
        <h1>Evaluación ICFES</h1>
        <h2>${escapeHtml(String(evaluation.name))}</h2>
        <div class="meta">
          <div><strong>Fecha:</strong> ${escapeHtml(String(evaluation.date))}</div>
          <div><strong>Período:</strong> ${escapeHtml(String(evaluation.academicPeriod))}</div>
          <div><strong>Preguntas:</strong> ${Number(evaluation.totalQuestions)}</div>
          <div><strong>Sistema de calificación:</strong> ${escapeHtml(String(evaluation.gradingSystem))}</div>
          <div><strong>Nota máxima:</strong> ${Number(evaluation.maxScore)}</div>
        </div>
        <div class="section-title">Resultados de estudiantes</div>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Respuestas</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="section-title">Distribución de notas (Decreto 1290)</div>
        <table>
          <thead>
            <tr>
              <th>Desempeño</th>
              <th>Rango</th>
              <th>Estudiantes</th>
            </tr>
          </thead>
          <tbody>${distributionRows}</tbody>
        </table>
      </body>
    </html>
  `;
};

export const exportExamToPDF = async (evaluationId: string): Promise<string> => {
  const evaluation = await Database.selectEvaluation(evaluationId);
  if (!evaluation) {
    throw new Error('Evaluación no encontrada');
  }

  const students = await Database.selectStudentsByEvaluation(evaluationId);
  const html = buildEvaluationHtml(evaluation, students);

  const file = await Print.printToFileAsync({ html });
  return file.uri;
};

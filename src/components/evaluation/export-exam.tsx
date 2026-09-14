import * as React from 'react';
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import * as Sharing from 'expo-sharing';
import { File, Paths, EncodingType } from 'expo-file-system';
import { useTheme } from '@/hooks/use-theme';
import { exportExamToJSON, exportExamToPDF } from '@/lib/examExport';

interface ExportExamProps {
  evaluationId: string;
  evaluationName?: string;
}

export const ExportExam: React.FC<ExportExamProps> = ({ evaluationId, evaluationName }) => {
  const colors = useTheme();

  const [exporting, setExporting] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);

  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const jsonData = await exportExamToJSON(evaluationId);
      const fileName = `${evaluationName || 'evaluacion'}.json`.replace(/\s+/g, '_');
      const file = new File(Paths.cache, fileName);
      file.create();
      file.write(jsonData, { encoding: EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
      } else {
        Alert.alert('Éxito', `JSON generado en: ${file.uri}`);
      }
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      Alert.alert('Error', 'No se pudo generar el archivo JSON');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const pdfUri = await exportExamToPDF(evaluationId);
      if (await Sharing.isAvailableAsync()) {
        setSharing(true);
        await Sharing.shareAsync(pdfUri, { mimeType: 'application/pdf' });
        setSharing(false);
      } else {
        Alert.alert('Éxito', `PDF generado en: ${pdfUri}`);
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    } finally {
      setExporting(false);
      setSharing(false);
    }
  };

  const busy = exporting || sharing;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundMuted }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.textStrong }]}>Exportar Evaluación</Text>

      <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
        <Text style={[styles.infoLabel, { color: colors.textWeak }]}>Evaluación</Text>
        <Text style={[styles.infoValue, { color: colors.textStrong }]}>
          {evaluationName || evaluationId}
        </Text>
      </View>

      {busy && (
        <View style={[styles.exporting, { backgroundColor: colors.border }]}>
          <ActivityIndicator size="small" />
          <Text style={[styles.exportingText, { color: colors.textSecondary }]}>
            {sharing ? 'Compartiendo archivo...' : 'Generando...'}
          </Text>
        </View>
      )}

      <View style={styles.buttons}>
        <View style={styles.buttonWrapper}>
          <Button title="Exportar a JSON" onPress={handleExportJSON} disabled={busy} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Exportar a PDF" onPress={handleExportPDF} disabled={busy} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoBox: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
  },
  exporting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
  },
  exportingText: {
    marginLeft: 10,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
});

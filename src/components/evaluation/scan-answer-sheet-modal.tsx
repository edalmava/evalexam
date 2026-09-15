import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions, type FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/use-theme';
import * as Database from '@/database';
import { createId } from '@/lib/ids';
import { calculateScore } from '@/lib/calculateScore';
import { processImageForScan } from '@/lib/scanImage';
import { scanAnswerSheet } from '@/lib/scanApiClient';
import { ScanError, collectScanWarnings, mapScanResponseToAnswers } from '@/lib/scanAnswerSheet';

type ScanStep = 'capture' | 'preview' | 'processing' | 'review';

type GradingSystem = '0-to-max' | '1-to-max';

export interface ScanEvaluationMeta {
  gradingSystem: GradingSystem;
  maxScore: number;
  weights: number[];
  correctAnswers: string[];
}

interface ScanAnswerSheetModalProps {
  onClose: () => void;
  evaluationId: string;
  studentId: string;
  totalQuestions: number;
  evaluationMeta: ScanEvaluationMeta;
  onSaved: (answers: string[]) => void;
}

const HELP_TEXTS = [
  'Asegúrate de tener buena iluminación',
  'Evita sombras sobre el papel',
  'Mantén la hoja recta y enfoca las preguntas',
];

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ScanError || error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export const ScanAnswerSheetModal: React.FC<ScanAnswerSheetModalProps> = ({
  onClose,
  evaluationId,
  studentId,
  totalQuestions,
  evaluationMeta,
  onSaved,
}) => {
  const colors = useTheme();
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = React.useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = React.useState(false);
  const [flash, setFlash] = React.useState<FlashMode>('off');
  const [step, setStep] = React.useState<ScanStep>('capture');
  const [photoUri, setPhotoUri] = React.useState<string | null>(null);
  const [columns, setColumns] = React.useState<1 | 2 | 3>(2);
  const [reviewAnswers, setReviewAnswers] = React.useState<string[]>([]);
  const [warnings, setWarnings] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission().catch(() => {});
    }
  }, [permission, requestPermission]);

  const logScan = React.useCallback(
    async (
      status: 'success' | 'error',
      rawResponse: string | null,
      errorMessage: string | null,
    ) => {
      try {
        await Database.insertScanLog(
          createId(),
          evaluationId,
          studentId,
          status,
          rawResponse,
          errorMessage,
        );
      } catch {
        // RF-23: un fallo al registrar no debe bloquear el flujo principal.
      }
    },
    [evaluationId, studentId],
  );

  const takePicture = async () => {
    if (!cameraReady || !cameraRef.current) return;
    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      setPhotoUri(picture.uri);
      setStep('preview');
    } catch (error) {
      Alert.alert('Error', 'No se pudo capturar la foto: ' + getErrorMessage(error));
    }
  };

  const pickFromGallery = async () => {
    const permissionResponse = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResponse.granted) {
      Alert.alert('Permiso necesario', 'La aplicación necesita permiso para acceder a la galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    const selected = !result.canceled ? result.assets[0] : null;
    if (selected) {
      setPhotoUri(selected.uri);
      setStep('preview');
    }
  };

  const runScan = async () => {
    if (!photoUri) return;
    setStep('processing');
    try {
      const image = await processImageForScan(photoUri);
      const response = await scanAnswerSheet({
        imageBase64: image.base64,
        mimeType: 'image/jpeg',
        totalQuestions,
        columns,
      });
      setReviewAnswers(mapScanResponseToAnswers(response, totalQuestions));
      setWarnings(collectScanWarnings(response, totalQuestions));
      setStep('review');
      await logScan('success', JSON.stringify(response), null);
    } catch (error) {
      await logScan('error', null, getErrorMessage(error));
      Alert.alert('No se pudo analizar la hoja', getErrorMessage(error), [
        { text: 'Marcar manualmente', style: 'cancel', onPress: onClose },
        { text: 'Reintentar', onPress: () => setStep('preview') },
      ]);
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setStep('capture');
  };

  const handleSave = async () => {
    try {
      const correctAnswers = evaluationMeta.correctAnswers;
      const hasKey = correctAnswers.length === totalQuestions;
      const useWeights =
        evaluationMeta.weights.length === totalQuestions ? evaluationMeta.weights : null;
      let score = 0;
      if (hasKey) {
        const correctPerQuestion = Array.from(
          { length: totalQuestions },
          (_, i) => reviewAnswers[i] === correctAnswers[i],
        );
        const correct = correctPerQuestion.filter(Boolean).length;
        score = calculateScore({
          system: evaluationMeta.gradingSystem,
          maxScore: evaluationMeta.maxScore,
          totalQuestions,
          correct,
          correctPerQuestion,
          weights: useWeights,
        }).score;
      }
      await Database.updateStudentAnswers(studentId, reviewAnswers, score, 'ai_scan');
      onSaved(reviewAnswers);
      onClose();
    } catch (error) {
      await logScan('error', null, getErrorMessage(error));
      Alert.alert('Error', 'No se pudieron guardar las respuestas: ' + getErrorMessage(error));
    }
  };

  const renderPermissionDenied = () => (
    <View style={[styles.deniedContainer, { backgroundColor: colors.backgroundMuted }]}>
      <Text style={[styles.deniedTitle, { color: colors.textStrong }]}>
        Permiso de cámara no disponible
      </Text>
      <Text style={[styles.deniedText, { color: colors.textWeak }]}>
        Puedes importar la foto desde la galería o marcar las respuestas manualmente.
      </Text>
      {permission?.canAskAgain && (
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: colors.success }]}
          onPress={() => requestPermission().catch(() => {})}
          accessibilityRole="button"
          accessibilityLabel="Permitir acceso a la cámara"
        >
          <Text style={styles.confirmButtonText}>Permitir cámara</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: colors.success }]}
        onPress={pickFromGallery}
        accessibilityRole="button"
        accessibilityLabel="Importar desde galería"
      >
        <Text style={styles.confirmButtonText}>Importar desde galería</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: colors.borderStrong }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Marcar manualmente"
      >
        <Text style={[styles.secondaryButtonText, { color: colors.textStrong }]}>
          Marcar manualmente
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCapture = () => (
    <View style={styles.captureContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flash}
        onCameraReady={() => setCameraReady(true)}
      />
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame} />
      </View>
      <View style={styles.helpBox} pointerEvents="none">
        {HELP_TEXTS.map((help) => (
          <Text key={help} style={styles.helpText}>
            • {help}
          </Text>
        ))}
      </View>

      <View style={styles.columnsSelector}>
        {([1, 2, 3] as const).map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.columnOption,
              {
                borderColor: value === columns ? colors.success : 'rgba(255,255,255,0.6)',
                backgroundColor: value === columns ? colors.success : 'rgba(0,0,0,0.4)',
              },
            ]}
            onPress={() => setColumns(value)}
            accessibilityRole="button"
            accessibilityLabel={`${value} columnas`}
            accessibilityState={{ selected: value === columns }}
          >
            <Text style={styles.columnOptionText}>{value} col</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.captureControls}>
        <TouchableOpacity
          style={[styles.flashButton, { borderColor: 'rgba(255,255,255,0.6)' }]}
          onPress={() =>
            setFlash((current) => (current === 'on' ? 'off' : current === 'off' ? 'auto' : 'on'))
          }
          accessibilityRole="button"
          accessibilityLabel={`Flash ${flash}`}
        >
          <Text style={styles.flashButtonText}>Flash: {flash}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shutterButton}
          onPress={takePicture}
          accessibilityRole="button"
          accessibilityLabel="Capturar foto"
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.galleryButton, { borderColor: 'rgba(255,255,255,0.6)' }]}
          onPress={pickFromGallery}
          accessibilityRole="button"
          accessibilityLabel="Importar desde galería"
        >
          <Text style={styles.flashButtonText}>Galería</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.cancelBar}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cancelar escaneo"
      >
        <Text style={styles.cancelBarText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPreview = () => (
    <View style={[styles.previewContainer, { backgroundColor: colors.backgroundMuted }]}>
      <Text style={[styles.previewTitle, { color: colors.textStrong }]}>
        ¿La foto se ve nítida?
      </Text>
      {photoUri && (
        <Image
          source={{ uri: photoUri }}
          style={styles.previewImage}
          resizeMode="contain"
          accessibilityLabel="Vista previa de la hoja de respuestas"
        />
      )}
      <View style={styles.previewButtons}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.borderStrong }]}
          onPress={handleRetake}
          accessibilityRole="button"
          accessibilityLabel="Repetir foto"
        >
          <Text style={[styles.secondaryButtonText, { color: colors.textStrong }]}>Repetir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: colors.success }]}
          onPress={runScan}
          accessibilityRole="button"
          accessibilityLabel="Confirmar foto y analizar"
        >
          <Text style={styles.confirmButtonText}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProcessing = () => (
    <View style={[styles.processingContainer, { backgroundColor: colors.backgroundMuted }]}>
      <ActivityIndicator size="large" color={colors.success} />
      <Text style={[styles.processingText, { color: colors.textStrong }]}>
        Analizando hoja de respuestas...
      </Text>
      <Text style={[styles.processingHint, { color: colors.textWeak }]}>
        Esto puede tardar unos segundos
      </Text>
    </View>
  );

  const renderReview = () => (
    <View style={[styles.reviewContainer, { backgroundColor: colors.backgroundMuted }]}>
      <Text style={[styles.reviewTitle, { color: colors.textStrong }]}>
        Revisar respuestas detectadas
      </Text>
      <Text style={[styles.reviewSubtitle, { color: colors.textWeak }]}>
        Corrige cualquier respuesta antes de guardar. Las preguntas sin detectar están resaltadas.
      </Text>
      {warnings.length > 0 && (
        <View style={[styles.warningsBox, { borderColor: colors.warning }]}>
          {warnings.map((warning) => (
            <Text key={warning} style={[styles.warningText, { color: colors.warning }]}>
              {warning}
            </Text>
          ))}
        </View>
      )}
      <ScrollView style={styles.reviewScroll} contentContainerStyle={styles.reviewScrollContent}>
        {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((questionNumber) => {
          const currentAnswer = reviewAnswers[questionNumber - 1] ?? '';
          const isMissing = currentAnswer === '';
          return (
            <View key={questionNumber} style={styles.answerRow}>
              <Text
                style={[
                  styles.questionLabel,
                  { color: isMissing ? colors.warning : colors.textSecondary },
                ]}
              >
                Pregunta {questionNumber}
                {isMissing ? ' — sin detectar' : ''}
              </Text>
              <View style={styles.answerOptions}>
                {(['A', 'B', 'C', 'D'] as const).map((option) => {
                  const selected = option === currentAnswer;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.answerOption,
                        {
                          borderColor: selected ? colors.success : colors.borderStrong,
                          backgroundColor: selected ? colors.successBackground : colors.background,
                        },
                        isMissing && styles.answerOptionMissing,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Pregunta ${questionNumber}, opción ${option}`}
                      accessibilityState={{ selected }}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      onPress={() => {
                        const next = [...reviewAnswers];
                        next[questionNumber - 1] = option;
                        setReviewAnswers(next);
                      }}
                    >
                      <Text
                        style={[
                          styles.answerOptionText,
                          { color: selected ? colors.success : colors.textSecondary },
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: colors.success }]}
        onPress={handleSave}
        accessibilityRole="button"
        accessibilityLabel="Guardar respuestas escaneadas"
      >
        <Text style={styles.confirmButtonText}>Guardar respuestas</Text>
      </TouchableOpacity>
    </View>
  );

  const permissionGranted = permission?.granted === true;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      {!permission && (
        <View style={[styles.processingContainer, { backgroundColor: colors.backgroundMuted }]} />
      )}
      {permission && !permissionGranted && renderPermissionDenied()}
      {permissionGranted && step === 'capture' && renderCapture()}
      {permissionGranted && step === 'preview' && renderPreview()}
      {permissionGranted && step === 'processing' && renderProcessing()}
      {permissionGranted && step === 'review' && renderReview()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  captureContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '88%',
    height: '52%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 10,
  },
  helpBox: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  helpText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 20,
  },
  columnsSelector: {
    position: 'absolute',
    top: 150,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
  columnOption: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  columnOptionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  captureControls: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  flashButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  flashButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  galleryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelBar: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelBarText: {
    color: '#208AEF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    padding: 16,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  previewImage: {
    flex: 1,
    width: '100%',
    borderRadius: 8,
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    alignSelf: 'stretch',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 14,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  processingHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  reviewContainer: {
    flex: 1,
    padding: 16,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  reviewSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  warningsBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  reviewScroll: {
    flex: 1,
  },
  reviewScrollContent: {
    paddingBottom: 16,
  },
  answerRow: {
    marginBottom: 10,
  },
  questionLabel: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
  },
  answerOptions: {
    flexDirection: 'row',
  },
  answerOption: {
    width: 44,
    height: 38,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  answerOptionMissing: {
    borderWidth: 2,
  },
  answerOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 16,
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deniedText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

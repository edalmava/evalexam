import * as React from "react"
import { View, Text, StyleSheet, Alert, Image, TouchableOpacity } from "react-native"
import * as ImagePicker from "expo-image-picker"

interface StudentPhotoProps {
  studentId: string
  onPhotoSelected: (uri: string) => void
}

export const StudentPhoto: React.FC<StudentPhotoProps> = ({
  studentId,
  onPhotoSelected,
}) => {
  const [hasCameraPermission, setHasCameraPermission] = React.useState(false)
  const [imageUri, setImageUri] = React.useState<string | null>(null)

  // Solicitar permiso de cámara
  React.useEffect(() => {
    let active = true
    ImagePicker.requestCameraPermissionsAsync().then((res) => {
      if (active) setHasCameraPermission(res.granted)
    })
    return () => {
      active = false
    }
  }, [])

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert("Permiso necesario", "La aplicación necesita permisos de galería")
      return
    }

    // Abrir selector de imagen
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled && result.uri) {
      setImageUri(result.uri)
      onPhotoSelected(result.uri)
    }
  }

  const takePhoto = async () => {
    if (!hasCameraPermission) {
      const permission = await ImagePicker.requestCameraPermissionsAsync()
      if (!permission.granted) {
        Alert.alert("Permiso necesario", "La aplicación necesita permisos de cámara")
        return
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled && result.uri) {
      setImageUri(result.uri)
      onPhotoSelected(result.uri)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Foto de la Evaluación (Evidencia)</Text>

      <Text style={styles.subtitle}>
        {hasCameraPermission ? "Ya tiene permiso de cámara" : "Solicitando permiso..."}
      </Text>

      {/* Mostrar imagen seleccionada si existe */}
      {imageUri && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.imageText}>Foto cargada como evidencia</Text>
        </View>
      )}

      {/* Botones para seleccionar imagen */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Tomar Foto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Seleccionar de Galería</Text>
        </TouchableOpacity>
      </View>

      {/* Nota sobre procesamiento automático */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          <Text style={styles.noteBold}>Nota:</Text> La foto se guarda como evidencia visual.
          El procesamiento automático de imágenes para calificación se postula para
          iteraciones posteriores al MVP (no procesado actualmente).
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#2d3748",
  },
  subtitle: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 10,
    textAlign: "center",
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageText: {
    fontSize: 12,
    color: "#718096",
    marginTop: 8,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#42b983",
    padding: 10,
    borderRadius: 6,
    minWidth: 120,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  noteContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#eab308",
    borderRadius: 6,
  },
  noteBold: {
    fontWeight: "bold",
  },
  noteText: {
    fontSize: 12,
    color: "#92400e",
  },
})
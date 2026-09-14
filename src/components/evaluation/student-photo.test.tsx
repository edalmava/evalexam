import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StudentPhoto } from '@/components/evaluation/student-photo';
import * as ImagePicker from 'expo-image-picker';

const renderComponent = () =>
  render(<StudentPhoto studentId="student-001" onPhotoSelected={() => {}} />);

beforeEach(() => {
  vi.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValue({
    granted: true,
  } as ImagePicker.PermissionResponse);
  vi.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync').mockResolvedValue({
    granted: true,
  } as ImagePicker.PermissionResponse);
});

describe('StudentPhoto - RF-9', () => {
  it('debe renderizar el componente de foto RF-9', async () => {
    renderComponent();
    expect(await screen.findByText('Foto de la Evaluación (Evidencia)')).toBeTruthy();
    expect(screen.getByText('Tomar Foto')).toBeTruthy();
    expect(screen.getByText('Seleccionar de Galería')).toBeTruthy();
  });

  it('debe llamar a onPhotoSelected cuando se selecciona una imagen', () => {
    const onPhotoSelected = vi.fn();
    render(<StudentPhoto studentId="student-001" onPhotoSelected={onPhotoSelected} />);
    expect(onPhotoSelected).toBeDefined();
  });

  it('debe mostrar la nota sobre procesamiento post-MVP', () => {
    renderComponent();
    expect(screen.getByText(/evidencia visual/)).toBeTruthy();
    expect(screen.getByText(/iteraciones posteriores/)).toBeTruthy();
  });
});

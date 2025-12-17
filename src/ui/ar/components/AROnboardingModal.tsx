import React, { useState } from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BlurView } from 'expo-blur';

interface AROnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

interface OnboardingSlide {
  title: string;
  emoji: string;
  description: string;
  tips: string[];
}

const slides: OnboardingSlide[] = [
  {
    title: 'Bienvenido al AR Testing',
    emoji: '👋',
    description: 'Esta pantalla te permite probar todas las funcionalidades de AR inmersivo.',
    tips: [
      'Necesitas un iPhone con LiDAR (iPhone 12 Pro+)',
      'Buena iluminación es importante',
      'Mueve el dispositivo lentamente al escanear',
      'Ten al menos 2-3 metros de espacio libre'
    ]
  },
  {
    title: 'Escaneo de Superficies',
    emoji: '📱',
    description: 'El primer paso es detectar planos (pisos, paredes, mesas).',
    tips: [
      '🎯 Tap Mode / Camera Mode: Alterna entre colocar con tap o posición fija',
      '👁️ Show/Hide Planes: Ver u ocultar la visualización de planos detectados',
      '⏸️ La detección es automática, solo mueve el dispositivo',
      '✅ Espera detectar al menos 1-2 planos antes de colocar modelos'
    ]
  },
  {
    title: 'Portal Mode & Oclusión',
    emoji: '🌌',
    description: 'Reemplaza la realidad con tu modelo 3D.',
    tips: [
      '🌌 Portal ON: Oculta el video de la cámara, solo ves el modelo 3D',
      '📹 Normal AR: Modo estándar con cámara visible',
      '👁️ Occlusion ON/OFF: Activa/desactiva oclusión por meshes reales',
      '⚙️ Quality Stats: Ver estadísticas de rendimiento y meshes',
      '📊 FPS Counter: Monitor de frames por segundo en tiempo real'
    ]
  },
  {
    title: 'Colisiones & Haptics',
    emoji: '💥',
    description: 'Detecta cuando modelos tocan paredes/pisos reales.',
    tips: [
      '🔴 Collision ON/OFF: Detecta colisiones físicas',
      '🐛 Collision Debug: Visualiza physics bodies',
      '📊 Collision Stats: Ver estadísticas de colisiones',
      '📳 Haptic ON/OFF: Vibración táctil al colisionar',
      '⚠️ Boundary ON/OFF: Alertas de proximidad a paredes',
      '⚙️ Haptic Settings: Ajustar distancia de alerta (10-200cm)'
    ]
  },
  {
    title: 'Gestión de Modelos',
    emoji: '📦',
    description: 'Carga, manipula y organiza tus modelos 3D.',
    tips: [
      '📂 Import USDZ Model: Cargar modelo 3D desde archivos',
      '📦 Load Room Scan: Cargar escaneo RoomPlan previo',
      '🎛️ Transform Model: Ajustar escala, rotación, posición',
      '↩️ Undo: Deshacer última acción',
      '🗑️ Clear All: Eliminar todos los modelos de la escena',
      '👆 Long Press + Pan/Rotate/Pinch: Manipular modelos con gestos'
    ]
  },
  {
    title: 'Workflow Recomendado',
    emoji: '🎯',
    description: 'Flujo óptimo para testing completo.',
    tips: [
      '1️⃣ Escanear superficies (mueve el dispositivo ~10-15 segundos)',
      '2️⃣ Cargar modelo 3D (Import USDZ)',
      '3️⃣ Colocar modelo (Tap Mode o Camera Mode)',
      '4️⃣ Ajustar con Transform Model si necesario',
      '5️⃣ Activar Portal Mode para ver reemplazo de realidad',
      '6️⃣ Activar Collision + Haptics para feedback inmersivo',
      '7️⃣ Caminar alrededor para probar oclusión y tracking'
    ]
  }
];

export const AROnboardingModal: React.FC<AROnboardingModalProps> = ({ visible, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    setCurrentSlide(slides.length - 1);
  };

  const handleClose = () => {
    setCurrentSlide(0);
    onClose();
  };

  const slide = slides[currentSlide];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <BlurView intensity={90} tint="dark" style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.emoji}>{slide.emoji}</Text>
              <Text style={styles.title}>{slide.title}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.description}>{slide.description}</Text>

              <View style={styles.tipsContainer}>
                {slide.tips.map((tip, index) => (
                  <View key={index} style={styles.tipRow}>
                    <View style={styles.tipBullet} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Progress Indicators */}
            <View style={styles.progressContainer}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === currentSlide && styles.progressDotActive
                  ]}
                />
              ))}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navigationContainer}>
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonSecondary]}
                onPress={currentSlide === 0 ? handleSkip : handlePrevious}
              >
                <Text style={styles.navButtonTextSecondary}>
                  {currentSlide === 0 ? 'Saltar' : 'Anterior'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, styles.navButtonPrimary]}
                onPress={handleNext}
              >
                <Text style={styles.navButtonTextPrimary}>
                  {currentSlide === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Slide Counter */}
            <Text style={styles.slideCounter}>
              {currentSlide + 1} / {slides.length}
            </Text>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  },
  contentContainer: {
    width: width * 0.9,
    maxWidth: 500,
    maxHeight: height * 0.85
  },
  card: {
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative'
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5
  },
  closeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600'
  },
  scrollView: {
    maxHeight: height * 0.45
  },
  scrollContent: {
    paddingBottom: 16
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24
  },
  tipsContainer: {
    gap: 12
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4A90E2',
    marginTop: 8
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 20
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)'
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#4A90E2'
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  navButtonPrimary: {
    backgroundColor: '#4A90E2'
  },
  navButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  navButtonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  navButtonTextSecondary: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600'
  },
  slideCounter: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500'
  }
});

# Paso 2.3: Verificación de Build Xcode - Análisis Completo

**Fecha:** 2025-12-08
**Estado:** DIAGNOSTICADO
**Problema:** Firma de código requiere configuración de cuenta Xcode

---

## Resultados de la Investigación

### Build Attempt 1: Sin variables de signing
```bash
xcodebuild build -workspace ios/creativedevartech.xcworkspace \
  -scheme creativedevartech \
  -configuration Debug
```

**Error:**
```
error: No profiles for 'com.ensayo.creativedev.artech' were found: 
Xcode couldn't find any iOS App Development provisioning profiles matching 'com.ensayo.creativedev.artech'.
```

**Causa:** Bundle ID sin perfil de provisión y autoatic signing deshabilitado.

---

### Build Attempt 2: Con DEVELOPMENT_TEAM (sin -allowProvisioningUpdates)
```bash
xcodebuild build -workspace ios/creativedevartech.xcworkspace \
  -scheme creativedevartech \
  DEVELOPMENT_TEAM="5R89574S2X"
```

**Error:** (Idéntico al intento 1)

**Causa:** DEVELOPMENT_TEAM necesita credenciales de cuenta en Xcode.

---

### Build Attempt 3: Con -allowProvisioningUpdates
```bash
xcodebuild build -workspace ios/creativedevartech.xcworkspace \
  -scheme creativedevartech \
  DEVELOPMENT_TEAM="5R89574S2X" \
  -allowProvisioningUpdates
```

**Error:**
```
error: No Account for Team "5R89574S2X". Add a new account in Accounts settings 
or verify that your accounts have valid credentials.
```

**Causa:** Apple Developer Account no está registrada en Xcode CLI.

---

## Opciones de Solución

### ❌ Opción 1: Configurar cuenta Xcode CLI (COMPLEJIDAD ALTA)

Requiere:
1. Agregar Apple ID a Xcode: `xcrun altool --store-password-in-keychain ...`
2. Verificar credenciales: `security find-certificate -a -p login.keychain`
3. Configurar provisioning profiles: descarga manual desde Apple Developer

**Problema:** Requiere autenticación interactiva, no ideal para CI/CD headless.

**Recomendación:** ❌ No usar para build CLI.

---

### ✅ Opción 2: Usar `npx expo run:ios` (RECOMENDADA)

**Por qué funciona:**
- Expo maneja toda la firma automáticamente
- Detecta signing identities locales
- Genera provisioning profiles si es necesario
- Interfaz interactiva para permisos

**Comando:**
```bash
npx expo run:ios --configuration=Debug
```

**Ventajas:**
- ✅ Automatizado
- ✅ Genera provisioning profiles automáticamente
- ✅ Compatible con bare workflow
- ✅ Maneja AppDelegate.swift

**Limitaciones:**
- ⚠️ Requiere interfaz de terminal (no ideal para CI/CD)
- ⚠️ Puede requerir interacción del usuario

**Status:** 🟢 RECOMENDADO para desarrollo local

---

### ⏸️ Opción 3: Usar fastlane (FUTURO - PARA CI/CD)

Para automatizar builds headless en CI/CD, usar fastlane:

```bash
# Instalar
brew install fastlane

# Configurar autofirma
fastlane action setup_ci
```

**Status:** 🔵 DIFERIDO - usar después si agregan CI/CD.

---

## Plan Alternativo: Verificación Simplificada

### Paso 2.3 Alternativo: Verificar con `npx expo run:ios`

**Objetivo:** Confirmar que Bare Workflow + metro + build system funcionan (sin xcodebuild manual).

**Comando:**
```bash
npx expo run:ios --configuration=Debug
```

**Qué verifica:**
- ✅ Estructura generada es válida
- ✅ CocoaPods resueltos correctamente
- ✅ Metro bundler funciona
- ✅ No hay conflictos entre Managed y Bare
- ✅ AppDelegate.swift se compila

**Qué NO verifica (pero no es crítico para Paso 2.3):**
- ❌ Firma con certificados específicos
- ❌ Provisioning profiles manuales

**Resultado esperado:**
```
✓ Built for 'iPhone 14 Pro Max' simulator
✓ Running on device/simulator
```

---

## Decisión de Continuación

### Opción A: Proceder con `npx expo run:ios`
- **Riesgo:** Bajo (Expo maneja todo)
- **Esfuerzo:** Mínimo
- **Validación:** Completa para Paso 2.3
- **Recomendación:** ✅ USAR ESTA

### Opción B: Esperar configuración completa de cuenta Xcode
- **Riesgo:** Alto (requiere múltiples pasos)
- **Esfuerzo:** Alto
- **Validación:** xcodebuild directo
- **Recomendación:** ⏸️ DIFERIR (hacer después en Paso 3)

---

## Estado Actual de Paso 2.3

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| expo prebuild | ✅ EXITOSO | Folders ios/ y android/ creadas |
| Estructura | ✅ VÁLIDA | .xcworkspace, Pods/, Podfile presente |
| CocoaPods | ✅ INSTALADO | Todas las dependencias resueltas |
| Bundle ID | ⚠️ NO VERIFICADO | com.ensayo.creativedev.artech (sin provisioning) |
| Team ID | ⚠️ NO VINCULADO | 5R89574S2X identificado pero sin cuenta Xcode |
| xcodebuild | ❌ FALLA | Requiere provisioning profiles |
| **npx expo run:ios** | ⏳ SIN INTENTAR | Debería funcionar |

---

## Próximas Acciones

### Inmediato (Paso 2.3 Continuación)
```bash
# Ejecutar build con Expo
npx expo run:ios --configuration=Debug
```

**Si FALLA:**
- Documentar error específico
- Verificar logs en `ios/build/`
- Posible issue: incompatibilidad AppDelegate.swift

**Si FUNCIONA:**
- ✅ Paso 2.3 COMPLETADO
- Proceder a Paso 3

---

### Paso 3: Configurar Xcode Project
Una vez que `npx expo run:ios` compila exitosamente:

1. **Abrir en Xcode:** `open ios/creativedevartech.xcworkspace`
2. **Signing & Capabilities:**
   - Team: Select en UI
   - Bundle ID: Verificar
   - ARKit capability: Agregar
3. **Info.plist:** Verificar permisos
4. **Rebuild:** `npx expo run:ios`

---

## Lecciones Aprendidas

### Bare Workflow + Firma de Código
- ✅ Expo prebuild funciona perfectamente
- ❌ xcodebuild manual requiere más setup
- ✅ `npx expo run:ios` maneja firma automáticamente
- ⚠️ AppDelegate como Swift (no Objective-C) es correcto

### Próximas Migraciones
- Usar siempre `npx expo run:ios` para desarrollo local
- Usar fastlane/GitHub Actions solo para CI/CD
- No intentar xcodebuild manual durante onboarding

---

**Última actualización:** 2025-12-08
**Autor:** Equipo creativedev.ar-tech

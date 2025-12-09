# Guía de EAS Build - Dispositivos Físicos iOS

**Fecha:** 2025-12-09
**Versión:** 1.0
**Target:** iPhone 14 Pro Max (Physical Device)

---

## Resumen Ejecutivo

Esta guía documenta cómo crear builds de desarrollo y preview con **Expo Application Services (EAS)** para probar en dispositivos físicos iOS.

### Configuración Actual

**Perfiles configurados en `eas.json`:**

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "ios": {
        "simulator": false
      }
    }
  }
}
```

**Características:**

- ✅ **Development:** Build completo con dev tools (Expo Dev Client)
- ✅ **Preview:** Build tipo producción pero con distribución interna
- ✅ **Physical Device Only:** `simulator: false` fuerza builds para dispositivos reales
- ✅ **Update Channels:** Separación de canales development/preview para OTA updates

---

## Prerequisitos

### 1. Cuenta Expo

```bash
# Login (si no has hecho login)
eas login
```

### 2. Apple Developer Account

- Cuenta activa de Apple Developer Program ($99/año)
- Acceso a certificados y provisioning profiles
- Xcode instalado con cuenta configurada

### 3. Configurar EAS CLI

```bash
# Instalar EAS CLI globalmente (si no está instalado)
npm install -g eas-cli

# Verificar instalación
eas --version
```

### 4. Configurar Proyecto

```bash
# Link proyecto a cuenta Expo (ya configurado en app.json)
# Verifica que exista:
"extra": {
  "eas": {
    "projectId": "b0a42bfc-cb0b-45a3-8181-e9399bb7ca80"
  }
}
```

---

## Flujo de Trabajo Completo

### Paso 1: Registrar Dispositivo

**Opción A: Conectar dispositivo por USB**

```bash
# Conectar iPhone al Mac vía cable
# EAS detectará automáticamente el UDID
eas device:create --platform ios
```

**Opción B: Registrar manualmente con UDID**

```bash
# Obtener UDID del dispositivo:
# 1. Conectar iPhone al Mac
# 2. Abrir Finder > Seleccionar iPhone
# 3. Click en "Serial Number" hasta ver UDID
# 4. Copiar UDID

# Registrar en EAS
eas device:create --platform ios
# Pegar UDID cuando lo solicite
```

**Verificar dispositivos registrados:**

```bash
eas device:list --platform ios
```

---

### Paso 2: Crear Build de Development

**¿Cuándo usar?**

- Testing diario en dispositivo físico
- Debug con React DevTools
- Hot reload y fast refresh
- Acceso completo a logs

**Comando:**

```bash
eas build --platform ios --profile development
```

**Proceso:**

1. EAS valida configuración
2. Sube código a servers EAS
3. Crea certificados/provisioning profiles (primera vez)
4. Compila app nativa con RoomPlan + ARKit
5. Genera archivo `.ipa` con internal distribution
6. Provee link/QR para instalación

**Tiempo estimado:** 10-15 minutos (primera vez), 5-10 min subsecuentes

**Output:**

```
✔ Build finished
https://expo.dev/artifacts/eas/[build-id].ipa
```

---

### Paso 3: Instalar Build en Dispositivo

**Opción A: Desde el iPhone directamente**

1. Abrir link de EAS en Safari (iPhone)
2. Tap "Install"
3. Seguir instrucciones de instalación
4. Abrir Ajustes > General > VPN y administración de dispositivos
5. Confiar en el perfil de desarrollo
6. Abrir app desde Home Screen

**Opción B: Escanear QR Code**

1. EAS mostrará QR code en terminal
2. Escanear con Cámara del iPhone
3. Abrir link en Safari
4. Seguir pasos de instalación

**Opción C: Desde Expo Dashboard**

1. Ir a <https://expo.dev/accounts/[tu-cuenta]/projects/artech/builds>
2. Seleccionar build completado
3. Tap "Install" en móvil
4. Seguir instrucciones

---

### Paso 4: Crear Build de Preview (Opcional)

**¿Cuándo usar?**

- Demos a clientes/stakeholders
- Testing pre-producción
- Builds más estables que development
- Sin dev tools (performance real)

**Comando:**

```bash
eas build --platform ios --profile preview
```

**Diferencias vs Development:**

- ❌ No tiene Expo Dev Client
- ❌ No hot reload
- ✅ Performance cercano a producción
- ✅ Tamaño de app menor
- ✅ Distribución interna (AdHoc)

**Instalación:** Igual que development build

---

## Updates Over-The-Air (OTA)

Una vez que tienes build instalado, puedes publicar actualizaciones JS sin recompilar:

### Publicar Update a Development Channel

```bash
eas update --branch development --message "Fix RoomPlan UI bug"
```

### Publicar Update a Preview Channel

```bash
eas update --branch preview --message "Demo version 1.1"
```

**Qué se actualiza:**

- ✅ JavaScript/TypeScript code
- ✅ Assets (imágenes, fonts)
- ✅ Configuración app.json (parcial)

**Qué NO se actualiza:**

- ❌ Código Swift nativo (RoomPlanModule)
- ❌ Pods de iOS
- ❌ Permisos nuevos
- ❌ Capabilities de Xcode

**Para cambios nativos → Rebuild completo necesario**

---

## Troubleshooting Común

### Error: "No devices registered"

**Solución:**

```bash
eas device:create --platform ios
```

### Error: "Provisioning profile invalid"

**Solución:**

```bash
# Re-generar certificados
eas build --platform ios --profile development --clear-provisioning-profile
```

### Error: "App install failed - Untrusted Developer"

**Solución:**

1. iPhone > Ajustes > General > VPN y administración de dispositivos
2. Seleccionar perfil de tu cuenta
3. Tap "Confiar en [Tu Cuenta]"

### Build falla con "Swift compilation error"

**Solución:**

```bash
# Limpiar cache EAS
eas build --platform ios --profile development --clear-cache
```

### "RoomPlan framework not found"

**Causa:** Build corrió en servidor sin capacidad ARKit
**Solución:** Verificar `eas.json` tenga `"simulator": false`

---

## Comandos de Referencia Rápida

```bash
# ============================================
# SETUP INICIAL (una sola vez)
# ============================================

# Login a EAS
eas login

# Registrar dispositivo
eas device:create --platform ios

# ============================================
# DEVELOPMENT WORKFLOW
# ============================================

# Build de desarrollo (con dev tools)
eas build --platform ios --profile development

# Publicar update JS (sin rebuild)
eas update --branch development --message "Bug fix"

# Ver status de build en progreso
eas build:list --platform ios --profile development

# ============================================
# PREVIEW WORKFLOW
# ============================================

# Build de preview (demo-ready)
eas build --platform ios --profile preview

# Publicar update a preview
eas update --branch preview --message "Demo v1.1"

# ============================================
# UTILIDADES
# ============================================

# Listar todos los builds
eas build:list

# Ver detalles de un build
eas build:view [build-id]

# Listar dispositivos registrados
eas device:list --platform ios

# Cancelar build en progreso
eas build:cancel [build-id]

# Ver logs de build
eas build:view [build-id] --log
```

---

## Workflow Recomendado

### Desarrollo Diario

```bash
# 1. Hacer cambios en código
# 2. Si cambios son SOLO JS/TS:
eas update --branch development --message "Descripción del cambio"

# 3. Si cambios incluyen Swift/native:
eas build --platform ios --profile development
```

### Demo a Cliente

```bash
# 1. Build de preview
eas build --platform ios --profile preview

# 2. Compartir link de instalación al cliente
# Link estará en: https://expo.dev/artifacts/...

# 3. Updates posteriores (sin rebuild):
eas update --branch preview --message "Fix typo in UI"
```

---

## Limitaciones Importantes

### Development Build

- ⚠️ **Tamaño:** ~200-300 MB (incluye dev tools)
- ⚠️ **Performance:** Ligeramente más lento que producción
- ⚠️ **Expira:** Provisioning profile expira en 1 año (renovable)

### Preview Build

- ⚠️ **Max Devices:** 100 dispositivos por cuenta Apple Developer
- ⚠️ **Distribución:** Solo AdHoc (no puede estar en App Store)
- ⚠️ **Updates:** OTA funciona, pero cambios nativos requieren rebuild

### EAS Free Tier

- ⚠️ **30 builds/mes** gratuitos
- Después: $29/mes (EAS Production Plan)

---

## Comparación de Opciones

| Feature | Local Build | Development Build (EAS) | Preview Build (EAS) | Production Build |
|---------|-------------|-------------------------|---------------------|------------------|
| **Comando** | `npx expo run:ios --device` | `eas build --profile development` | `eas build --profile preview` | `eas build --profile production` |
| **Dev Tools** | ✅ | ✅ | ❌ | ❌ |
| **Hot Reload** | ✅ | ✅ | ❌ | ❌ |
| **OTA Updates** | ❌ | ✅ | ✅ | ✅ |
| **Distribution** | USB only | Internal (100 devices) | Internal (100 devices) | App Store |
| **Build Time** | 5-10 min | 10-15 min | 10-15 min | 15-20 min |
| **Requiere Mac** | ✅ | ❌ | ❌ | ❌ |
| **Cloud Build** | ❌ | ✅ | ✅ | ✅ |
| **Performance** | Dev | Dev | Production-like | Production |

---

## Next Steps

Después de configurar EAS builds:

1. ✅ **Testear RoomPlan en device:** Ver `docs/NEXT_STEPS.md`
2. ✅ **Integrar ViewManager en Xcode:** Ver Paso 7
3. ⏳ **Setup CI/CD con EAS:** Automatizar builds en GitHub Actions
4. ⏳ **Configurar Sentry:** Error tracking en producción

---

## Recursos Externos

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Internal Distribution Guide](https://docs.expo.dev/build/internal-distribution/)
- [EAS Pricing](https://expo.dev/pricing)

---

**Última actualización:** 2025-12-09
**Autor:** Equipo creativedev.ar-tech

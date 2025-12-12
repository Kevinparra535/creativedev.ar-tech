# Guía de Exportación de Archivos

Esta guía explica cómo exportar modelos 3D y otros archivos para que sean visibles en la app **Archivos** (Files) del iPhone.

## Configuración Completada

Se han implementado las siguientes funcionalidades:

### 1. Configuración de iOS (Info.plist)

Se agregaron las siguientes claves al archivo `Info.plist`:

```xml
<key>UIFileSharingEnabled</key>
<true/>
<key>LSSupportsOpeningDocumentsInPlace</key>
<true/>
<key>UISupportsDocumentBrowser</key>
<true/>
```

Estas configuraciones permiten que:
- Los archivos de la app sean visibles en la app Archivos
- Los usuarios puedan abrir archivos directamente desde Archivos
- La app soporte el explorador de documentos de iOS

### 2. Módulo Nativo Swift (ExpoFileExportModule)

Se creó un módulo nativo que proporciona las siguientes funciones:

- **`getDocumentsDirectory()`**: Obtiene la ruta del directorio de documentos
- **`exportToDocuments(sourcePath, fileName)`**: Copia un archivo al directorio de documentos
- **`shareFile(filePath)`**: Abre el Share Sheet de iOS para compartir archivos
- **`listDocumentsFiles()`**: Lista todos los archivos en el directorio de documentos
- **`deleteFile(filePath)`**: Elimina un archivo del directorio de documentos

### 3. Interfaz TypeScript

Se creó un módulo TypeScript (`src/modules/FileExportModule.ts`) que expone las funciones nativas:

```typescript
import { FileExport } from '@/modules';

// Exportar un archivo a Documentos
const result = await FileExport.exportToDocuments(
  '/path/to/source/file.usdz',
  'my-model.usdz'
);

// Compartir un archivo
await FileExport.shareFile('/path/to/file.usdz');

// Listar archivos guardados
const files = FileExport.listDocumentsFiles();

// Eliminar un archivo
await FileExport.deleteFile('/path/to/file.usdz');
```

### 4. Componente de UI (FileExportButton)

Se creó un componente React Native completo con botones para:

1. **Exportar a Archivos**: Guarda el archivo en la carpeta de Documentos
2. **Compartir Archivo**: Abre el Share Sheet para compartir vía AirDrop, guardar en iCloud, etc.
3. **Ver Archivos Guardados**: Muestra la lista de archivos exportados

## Cómo Usar

### Opción 1: Usar el Componente FileExportButton

```tsx
import { FileExportButton } from '@/ui/ar/components';

function MyScreen() {
  const [exportedFilePath, setExportedFilePath] = useState<string>();

  return (
    <View>
      {/* Tu contenido AR */}

      <FileExportButton
        filePath="/path/to/model.usdz"
        fileName="my-exported-model.usdz"
        onExportComplete={(path) => {
          setExportedFilePath(path);
          console.log('Archivo exportado a:', path);
        }}
      />
    </View>
  );
}
```

### Opción 2: Usar el Módulo Directamente

```tsx
import { FileExport } from '@/modules';
import { Alert } from 'react-native';

async function exportModel(sourcePath: string) {
  try {
    const result = await FileExport.exportToDocuments(
      sourcePath,
      'my-model.usdz'
    );

    Alert.alert(
      'Exportado',
      `Archivo guardado en:\n\nArchivos > En mi iPhone > creativedev.ar-tech\n\n${result.fileName}`
    );
  } catch (error) {
    Alert.alert('Error', `No se pudo exportar: ${error}`);
  }
}

async function shareModel(filePath: string) {
  try {
    await FileExport.shareFile(filePath);
  } catch (error) {
    Alert.alert('Error', `No se pudo compartir: ${error}`);
  }
}
```

## Cómo Ver los Archivos en el iPhone

1. Abre la app **Archivos** (Files) 📱
2. Ve a la sección **"En mi iPhone"** o **"On My iPhone"**
3. Busca la carpeta **"creativedev.ar-tech"**
4. Los archivos exportados estarán allí
5. Toca un archivo para previsualizarlo (funciona con USDZ, imágenes, PDFs, etc.)

## Ejemplo de Integración con RoomPlan

Si estás usando el módulo de RoomPlan que ya devuelve la ubicación del archivo:

```tsx
import { useRoomPlan } from '@/ui/ar/hooks/useRoomPlan';
import { FileExport } from '@/modules';

function RoomScanScreen() {
  const { startScanning } = useRoomPlan();

  const handleStartScan = async () => {
    try {
      const result = await startScanning('Mi Habitación');

      // RoomPlan devuelve la ubicación del archivo USDZ exportado
      if (result.exportedURL) {
        // Copiar al directorio de documentos para hacerlo visible en Files
        const exported = await FileExport.exportToDocuments(
          result.exportedURL,
          `room-scan-${Date.now()}.usdz`
        );

        console.log('Modelo disponible en Files app:', exported.path);
      }
    } catch (error) {
      console.error('Error al escanear:', error);
    }
  };

  return (
    <Button title="Escanear Habitación" onPress={handleStartScan} />
  );
}
```

## Ejemplo de Exportación de Mesh ARKit

Para exportar meshes generados por ARKit:

```tsx
import { FileExport } from '@/modules';

async function exportMeshToDocuments(meshData: MeshInfo) {
  // Primero, guarda el mesh en un archivo temporal
  const tempPath = `${FileExport.getDocumentsDirectory()}/temp-mesh.obj`;

  // Convierte el mesh a formato OBJ o USDZ (implementación depende de tu caso)
  // ... código de conversión ...

  // Luego exporta el archivo
  const result = await FileExport.exportToDocuments(
    tempPath,
    `mesh-${meshData.id}.obj`
  );

  console.log('Mesh exportado:', result.path);
}
```

## Formatos de Archivo Soportados

Los archivos que puedes exportar y visualizar en la app Archivos incluyen:

- **USDZ** - Modelos 3D de ARKit (con Quick Look integrado)
- **OBJ** - Modelos 3D
- **PNG/JPG** - Imágenes
- **JSON** - Datos de RoomPlan
- **PDF** - Documentos
- Cualquier otro tipo de archivo

## Compilación

Después de agregar el módulo, necesitas:

1. Instalar las dependencias de pods:
   ```bash
   cd ios && pod install
   ```

2. Reconstruir el proyecto:
   ```bash
   npx expo prebuild --clean
   npx expo run:ios
   ```

## Troubleshooting

### El módulo no se encuentra

Si obtienes un error como "ExpoFileExport is not defined":

1. Asegúrate de que el módulo esté registrado en `expo-module.config.json`
2. Ejecuta `pod install` en la carpeta `ios/`
3. Limpia el build: `npx expo prebuild --clean`
4. Reconstruye la app

### Los archivos no aparecen en la app Archivos

1. Verifica que `UIFileSharingEnabled` esté en `true` en el `Info.plist`
2. Asegúrate de que los archivos estén en el directorio de Documentos, no en un subdirectorio
3. Reinicia la app Archivos
4. Desconecta y reconecta el iPhone del ordenador (si está conectado)

### Error al exportar archivos

- Verifica que el archivo de origen exista
- Asegúrate de que el path sea absoluto, no relativo
- Revisa los permisos de la app en Configuración > Archivos

## Share Sheet Nativo (Actualización 2025-12-12)

### Nueva Funcionalidad: Compartir Archivos USDZ

Se ha agregado integración con el Share Sheet nativo de iOS para compartir archivos USDZ directamente desde la aplicación.

#### Uso en ARTestScreen

El ARTestScreen ahora incluye un botón de exportación en cada archivo del Room Scan Picker:

```tsx
import { Share } from 'react-native';

const handleExportRoomScan = async (fileUri: string, fileName: string) => {
  try {
    await Share.share({
      url: fileUri,
      title: 'Export Room Scan',
      message: `Sharing ${fileName}`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    Alert.alert('Export Error', `Failed to share file: ${errorMessage}`);
  }
};
```

#### Características

- **Share Sheet Nativo**: Abre el compartidor nativo de iOS
- **Múltiples Destinos**:
  - AirDrop
  - Messages
  - Mail
  - Guardar en Files
  - iCloud Drive
  - Cualquier app compatible con archivos USDZ
- **UI Integrada**: Botón con ícono ↗️ en cada file item
- **Sin Configuración Adicional**: Usa el API nativo de React Native

#### Estructura de UI

El Room Scan Picker ahora tiene dos áreas clickeables por cada archivo:

1. **Área Principal (izquierda)**: Carga el modelo en la vista AR
2. **Botón Azul (derecha)**: Abre el Share Sheet para exportar

```tsx
<View style={styles.fileItem}>
  <TouchableOpacity onPress={() => handleLoadRoomScan(...)}>
    <View style={styles.fileItemInfo}>
      <Text>📁 {item.name}</Text>
      <Text>{formatFileSize(item.size)}</Text>
    </View>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.fileItemExportButton}
    onPress={() => handleExportRoomScan(item.uri, item.name)}
  >
    <Text style={styles.fileItemExportIcon}>↗️</Text>
  </TouchableOpacity>
</View>
```

#### Estilos

```typescript
fileItem: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#2C2C2E',
  borderRadius: 12,
}

fileItemExportButton: {
  padding: 16,
  backgroundColor: '#007AFF',
  borderTopRightRadius: 12,
  borderBottomRightRadius: 12,
  minWidth: 60,
}

fileItemExportIcon: {
  fontSize: 24,
}
```

#### Flujo del Usuario

1. Usuario abre el Room Scan Picker
2. Ve la lista de archivos USDZ guardados
3. Toca el botón ↗️ en cualquier archivo
4. Se abre el Share Sheet nativo de iOS
5. Elige destino (AirDrop, Files, Mail, etc.)
6. El archivo se comparte/guarda

#### Ejemplo Completo de Integración

```tsx
import React from 'react';
import { Share, Alert, FlatList, View, Text, TouchableOpacity } from 'react-native';

function RoomScanExporter() {
  const handleShare = async (fileUri: string, fileName: string) => {
    try {
      await Share.share({
        url: fileUri,
        title: 'Room Scan Export',
        message: `Sharing ${fileName}`
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share file');
    }
  };

  return (
    <FlatList
      data={usdzFiles}
      renderItem={({ item }) => (
        <View style={{ flexDirection: 'row' }}>
          {/* Load button */}
          <TouchableOpacity onPress={() => loadModel(item.uri)}>
            <Text>Load {item.name}</Text>
          </TouchableOpacity>

          {/* Share button */}
          <TouchableOpacity onPress={() => handleShare(item.uri, item.name)}>
            <Text>↗️</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}
```

## Próximos Pasos

Posibles mejoras futuras:

1. Exportar meshes directamente a USDZ
2. Agregar previsualizaciones de modelos 3D antes de exportar
3. Soporte para exportar múltiples archivos a la vez
4. ~~Integración con Share Sheet nativo~~ ✅ Completado
5. Compresión automática de archivos grandes

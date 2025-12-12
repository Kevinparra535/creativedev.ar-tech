# Ejemplo de Exportación de Modelos AR

Este documento muestra ejemplos concretos de cómo exportar modelos 3D generados en ARKit para que sean visibles en la app Archivos del iPhone.

## Ejemplo 1: Exportar un Modelo USDZ

```tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { FileExport } from '@/modules';

function ExportModelExample() {
  const [modelPath, setModelPath] = useState<string>();

  const handleExportModel = async () => {
    // Supongamos que tienes un archivo USDZ en el bundle o cache
    const sourcePath = '/path/to/your/model.usdz';

    try {
      // Exportar al directorio de Documentos
      const result = await FileExport.exportToDocuments(
        sourcePath,
        `modelo-${Date.now()}.usdz`
      );

      Alert.alert(
        '✅ Modelo Exportado',
        `Tu modelo se guardó exitosamente!\n\n` +
        `Para verlo:\n` +
        `1. Abre la app "Archivos"\n` +
        `2. Ve a "En mi iPhone"\n` +
        `3. Busca "creativedev.ar-tech"\n` +
        `4. Toca el archivo para previsualizarlo en AR`
      );

      setModelPath(result.path);
    } catch (error) {
      Alert.alert('Error', `No se pudo exportar: ${error}`);
    }
  };

  return (
    <TouchableOpacity onPress={handleExportModel}>
      <Text>Exportar Modelo a Archivos</Text>
    </TouchableOpacity>
  );
}
```

## Ejemplo 2: Usar el Componente FileExportButton

La forma más sencilla es usar el componente pre-construido:

```tsx
import { FileExportButton } from '@/ui/ar/components';

function MyARScreen() {
  return (
    <View style={{ flex: 1 }}>
      {/* Tu vista AR */}

      {/* Botones de exportación */}
      <FileExportButton
        filePath="/path/to/model.usdz"
        fileName="mi-modelo.usdz"
        onExportComplete={(path) => {
          console.log('Archivo disponible en:', path);
        }}
      />
    </View>
  );
}
```

## Ejemplo 3: Exportar Scan de RoomPlan

Si estás usando RoomPlan, puedes exportar directamente el resultado:

```tsx
import { useRoomPlan } from '@/ui/ar/hooks/useRoomPlan';
import { FileExport } from '@/modules';
import { Alert } from 'react-native';

function RoomPlanExportExample() {
  const { startScanning } = useRoomPlan();

  const handleScanAndExport = async () => {
    try {
      // Iniciar el escaneo
      const result = await startScanning('Mi Sala');

      console.log('Resultado del scan:', result);

      // El resultado contiene la ubicación del archivo exportado
      if (result.exportedURL) {
        // Copiar a Documentos para hacerlo visible en Files
        const exported = await FileExport.exportToDocuments(
          result.exportedURL,
          `habitacion-${Date.now()}.usdz`
        );

        Alert.alert(
          '🏠 Habitación Escaneada',
          `Tu modelo 3D está listo!\n\n` +
          `Archivo: ${exported.fileName}\n\n` +
          `Encuéntralo en:\n` +
          `Archivos > En mi iPhone > creativedev.ar-tech`,
          [
            {
              text: 'Compartir',
              onPress: () => FileExport.shareFile(exported.path)
            },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', `No se pudo completar el escaneo: ${error}`);
    }
  };

  return (
    <TouchableOpacity onPress={handleScanAndExport}>
      <Text>Escanear y Exportar Habitación</Text>
    </TouchableOpacity>
  );
}
```

## Ejemplo 4: Exportar Mesh de ARKit

Para exportar geometría detectada por ARKit:

```tsx
import { FileExport } from '@/modules';
import * as FileSystem from 'expo-file-system';

async function exportMeshAsOBJ(meshData: MeshInfo) {
  try {
    // Convertir mesh a formato OBJ
    const objContent = convertMeshToOBJ(meshData);

    // Guardar temporalmente
    const tempPath = `${FileSystem.cacheDirectory}temp-mesh.obj`;
    await FileSystem.writeAsStringAsync(tempPath, objContent);

    // Exportar a Documentos
    const result = await FileExport.exportToDocuments(
      tempPath,
      `mesh-${meshData.id}-${Date.now()}.obj`
    );

    console.log('Mesh exportado a:', result.path);

    return result.path;
  } catch (error) {
    console.error('Error exportando mesh:', error);
    throw error;
  }
}

function convertMeshToOBJ(meshData: MeshInfo): string {
  // Implementación simplificada - ajusta según tu estructura de datos
  let obj = '# Mesh exportado desde ARKit\n\n';

  // Vértices
  obj += '# Vertices\n';
  for (let i = 0; i < meshData.vertexCount; i++) {
    // Asumiendo que tienes acceso a los datos de vértices
    obj += `v ${meshData.vertices[i].x} ${meshData.vertices[i].y} ${meshData.vertices[i].z}\n`;
  }

  // Normales (opcional)
  obj += '\n# Normals\n';
  // ... agregar normales ...

  // Caras
  obj += '\n# Faces\n';
  // ... agregar caras ...

  return obj;
}
```

## Ejemplo 5: Compartir Modelo via AirDrop o WhatsApp

```tsx
import { FileExport } from '@/modules';
import { Alert, ActionSheetIOS } from 'react-native';

async function shareModelWithOptions(filePath: string) {
  ActionSheetIOS.showActionSheetWithOptions(
    {
      options: [
        'Cancelar',
        'Guardar en Archivos',
        'Compartir (AirDrop, WhatsApp, etc.)'
      ],
      cancelButtonIndex: 0,
    },
    async (buttonIndex) => {
      if (buttonIndex === 1) {
        // Guardar en Archivos
        const result = await FileExport.exportToDocuments(
          filePath,
          `modelo-${Date.now()}.usdz`
        );
        Alert.alert('Guardado', `Archivo en: ${result.fileName}`);
      } else if (buttonIndex === 2) {
        // Compartir
        await FileExport.shareFile(filePath);
      }
    }
  );
}
```

## Ejemplo 6: Gestionar Archivos Exportados

```tsx
import { FileExport } from '@/modules';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

function ExportedFilesList() {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    // Cargar lista de archivos
    const fileList = FileExport.listDocumentsFiles();
    setFiles(fileList);
  }, []);

  const handleDeleteFile = async (filePath: string) => {
    try {
      await FileExport.deleteFile(filePath);
      // Recargar lista
      setFiles(FileExport.listDocumentsFiles());
      Alert.alert('Eliminado', 'Archivo eliminado exitosamente');
    } catch (error) {
      Alert.alert('Error', `No se pudo eliminar: ${error}`);
    }
  };

  const handleShareFile = async (filePath: string) => {
    try {
      await FileExport.shareFile(filePath);
    } catch (error) {
      Alert.alert('Error', `No se pudo compartir: ${error}`);
    }
  };

  return (
    <FlatList
      data={files}
      keyExtractor={(item) => item.path}
      renderItem={({ item }) => (
        <View style={{ padding: 16, borderBottomWidth: 1 }}>
          <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
          <Text style={{ color: '#666' }}>
            Tamaño: {(item.size / 1024).toFixed(2)} KB
          </Text>
          <Text style={{ color: '#666' }}>
            Creado: {new Date(item.createdAt * 1000).toLocaleDateString()}
          </Text>

          <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
            <TouchableOpacity
              onPress={() => handleShareFile(item.path)}
              style={{ padding: 8, backgroundColor: '#007AFF', borderRadius: 4 }}
            >
              <Text style={{ color: 'white' }}>Compartir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteFile(item.path)}
              style={{ padding: 8, backgroundColor: '#FF3B30', borderRadius: 4 }}
            >
              <Text style={{ color: 'white' }}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}
```

## Ejemplo 7: Integración Completa en ARTestScreen

Aquí hay un ejemplo de cómo integrar la exportación en tu pantalla de AR:

```tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ARKitView } from '@/ui/ar/components';
import { FileExportButton } from '@/ui/ar/components';
import { FileExport } from '@/modules';

export function ARTestScreenWithExport() {
  const [capturedModelPath, setCapturedModelPath] = useState<string>();

  const handleCaptureModel = async () => {
    // Aquí implementarías la lógica para capturar/generar el modelo
    // Por ejemplo, usando ARKit para exportar la escena
    // Este es un placeholder
    const modelPath = '/path/to/captured/model.usdz';
    setCapturedModelPath(modelPath);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Vista AR */}
      <ARKitView style={{ flex: 1 }} />

      {/* Controles */}
      <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0 }}>
        <TouchableOpacity
          onPress={handleCaptureModel}
          style={{
            backgroundColor: '#007AFF',
            padding: 16,
            margin: 16,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Capturar Modelo
          </Text>
        </TouchableOpacity>

        {capturedModelPath && (
          <FileExportButton
            filePath={capturedModelPath}
            fileName={`ar-model-${Date.now()}.usdz`}
            onExportComplete={(path) => {
              console.log('Modelo exportado:', path);
            }}
          />
        )}
      </View>
    </View>
  );
}
```

## Ejemplo 8: Usar Share Sheet Nativo (Nuevo - 2025-12-12)

La forma más sencilla de compartir archivos USDZ es usar el Share Sheet nativo de React Native:

```tsx
import { Share, Alert } from 'react-native';

async function shareRoomScan(fileUri: string, fileName: string) {
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
}

// Uso en un componente
function ShareButton({ fileUri, fileName }: { fileUri: string; fileName: string }) {
  return (
    <TouchableOpacity
      style={{
        padding: 16,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        alignItems: 'center',
      }}
      onPress={() => shareRoomScan(fileUri, fileName)}
    >
      <Text style={{ color: 'white', fontSize: 24 }}>↗️</Text>
    </TouchableOpacity>
  );
}
```

### Ventajas del Share Sheet Nativo

1. **Sin Configuración**: No requiere permisos adicionales ni módulos nativos
2. **Múltiples Destinos**: Funciona con AirDrop, Messages, Mail, Files, iCloud, etc.
3. **UX Nativa**: Los usuarios ya conocen esta interfaz
4. **Rápido**: No requiere copiar archivos, comparte directamente la URL

### Integración en Room Scan Picker

Ejemplo completo de cómo se integra en el ARTestScreen:

```tsx
import { Share, FlatList, View, Text, TouchableOpacity } from 'react-native';

function RoomScanPickerWithShare() {
  const handleExportRoomScan = async (fileUri: string, fileName: string) => {
    try {
      await Share.share({
        url: fileUri,
        title: 'Export Room Scan',
        message: `Sharing ${fileName}`
      });
    } catch (error) {
      Alert.alert('Export Error', `Failed to share file`);
    }
  };

  return (
    <FlatList
      data={usdzFiles}
      renderItem={({ item }) => (
        <View style={styles.fileItem}>
          {/* Load button */}
          <TouchableOpacity
            style={styles.fileItemContent}
            onPress={() => handleLoadRoomScan(item.uri, item.name)}
          >
            <View style={styles.fileItemInfo}>
              <Text style={styles.fileItemName}>📁 {item.name}</Text>
              <Text style={styles.fileItemDetails}>
                {formatFileSize(item.size)} • {formatDate(item.modificationTime)}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Export button */}
          <TouchableOpacity
            style={styles.fileItemExportButton}
            onPress={() => handleExportRoomScan(item.uri, item.name)}
          >
            <Text style={styles.fileItemExportIcon}>↗️</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  fileItem: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center'
  },
  fileItemContent: {
    flex: 1,
    padding: 16
  },
  fileItemExportButton: {
    padding: 16,
    backgroundColor: '#007AFF',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60
  },
  fileItemExportIcon: {
    fontSize: 24
  }
});
```

## Resumen de Pasos para el Usuario

### Opción 1: Exportar a Archivos
1. **Exportar**: Toca el botón "Exportar a Archivos"
2. **Abrir Archivos**: Abre la app "Archivos" en tu iPhone
3. **Navegar**: Ve a "En mi iPhone" > "creativedev.ar-tech"
4. **Visualizar**: Toca el archivo .usdz para verlo en AR con Quick Look

### Opción 2: Compartir con Share Sheet (Nuevo)
1. **Compartir**: Toca el botón ↗️ en cualquier archivo
2. **Elegir Destino**: Se abre el Share Sheet nativo de iOS
3. **Seleccionar**:
   - AirDrop para enviar a otro dispositivo
   - Messages para compartir por mensaje
   - Mail para enviar por correo
   - "Guardar en Archivos" para guardar en iCloud o local
4. **Confirmar**: El archivo se comparte/guarda automáticamente

## Formatos Recomendados

- **USDZ**: Mejor para modelos 3D con soporte AR nativo en iOS
- **OBJ**: Compatible con muchas apps 3D
- **JSON**: Para datos de RoomPlan y metadata

## Próximos Pasos

1. Compila la app: `npx expo run:ios`
2. Prueba exportar un modelo
3. Verifica que aparezca en la app Archivos
4. Comparte el archivo usando AirDrop

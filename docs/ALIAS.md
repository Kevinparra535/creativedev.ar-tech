# Configuración de Alias en TypeScript

## Alias Configurado

Este proyecto utiliza el alias `@/` para importaciones absolutas desde la carpeta `src/`.

### Ejemplo de uso:

```typescript
// ✅ Correcto - Usando alias
import { ThemedText } from '@/ui/components/ThemedText';
import { Colors } from '@/ui/theme/colors';
import { useColorScheme } from '@/core/hooks/use-color-scheme';

// ❌ Evitar - Rutas relativas complejas
import { ThemedText } from '../../../ui/components/ThemedText';
```

## Archivos de Configuración

### 1. `tsconfig.json`
Configura TypeScript para reconocer los alias durante el desarrollo:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 2. `babel.config.js`
Configura Babel para transformar los alias en runtime:

```javascript
module.exports = {
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@': './src',
        },
      },
    ],
  ],
};
```

## Estructura de Importaciones Recomendada

```
@/ui/screens/*         - Pantallas de la aplicación
@/ui/components/*      - Componentes reutilizables
@/ui/navigation/*      - Navegación y tipos
@/ui/theme/*           - Colores, fuentes, estilos
@/domain/entities/*    - Entidades de negocio
@/domain/usecases/*    - Casos de uso
@/data/repositories/*  - Repositorios
@/data/datasources/*   - Fuentes de datos
@/core/hooks/*         - Hooks personalizados
@/core/utils/*         - Utilidades
@/core/constants/*     - Constantes
```

## Nota Importante

Después de modificar `babel.config.js`, siempre reinicia el servidor de Metro con:

```bash
npm start -- --clear
```

Esto limpia la caché y aplica los cambios de configuración.

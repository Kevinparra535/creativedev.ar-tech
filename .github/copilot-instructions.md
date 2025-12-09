# Copilot Instructions for creativedev.ar-tech

## Project Overview
React Native app built with Expo SDK 54 and React Navigation. Uses React 19, TypeScript (strict mode), and the new React Compiler experimental feature. Supports iOS, Android, and web with React Native's New Architecture enabled.

## Architecture

### Clean Architecture Structure
Project follows clean architecture principles with clear separation of concerns:
- `src/ui/` - All UI-related code (screens, components, navigation)
  - `src/ui/screens/` - Screen components (HomeScreen, ExploreScreen, etc.)
  - `src/ui/components/` - Reusable UI components
  - `src/ui/navigation/` - Navigation configuration and navigators
  - `src/ui/theme/` - Theme definitions and styling
- `src/domain/` - Business logic and entities
- `src/data/` - Data sources and repositories
- `src/core/` - Shared utilities, hooks, and constants

### Navigation (@react-navigation)
Uses React Navigation v7 with bottom tabs and stack navigators:
- `src/ui/navigation/AppNavigator.tsx` - Root navigator setup
- `src/ui/navigation/TabNavigator.tsx` - Bottom tab navigation
- Type-safe navigation with TypeScript param lists
- Stack navigators for nested navigation flows

**Navigation pattern:**
```tsx
// Type definitions
type RootStackParamList = {
  Home: undefined;
  Details: { id: string };
};

// Usage with hooks
const navigation = useNavigation<NavigationProp<RootStackParamList>>();
navigation.navigate('Details', { id: '123' });
```

### Theming System
Central theme management with automatic light/dark mode support:
- `src/ui/theme/colors.ts` - Color definitions for both modes
- `src/ui/theme/fonts.ts` - Font family definitions
- `src/core/hooks/use-color-scheme.ts` - Re-exports `useColorScheme` from React Native
- `src/core/hooks/use-theme-color.ts` - Hook for theme-aware color selection
- **Pattern**: Components accept `lightColor` and `darkColor` props that override theme defaults

### Component Conventions
- **UI components live in `src/ui/components/`**
- **Themed components**: Prefix with `Themed` (e.g., `ThemedText`, `ThemedView`)
  - Example: `<ThemedText type="title" lightColor="#000" darkColor="#fff">`
  - Types: `default`, `title`, `defaultSemiBold`, `subtitle`, `link`
- **Icon system**: `IconSymbol` uses SF Symbols on iOS, Material Icons elsewhere
  - Define mappings in `src/ui/components/icons/IconSymbol.tsx` MAPPING object
  - iOS version in `IconSymbol.ios.tsx` uses expo-symbols
- **Platform-specific files**: Use `.ios.tsx`, `.web.ts` suffixes for platform overrides

### Import Paths
Use `@/` alias for absolute imports (configured in `tsconfig.json` and `babel.config.js`):
```tsx
import { ThemedText } from '@/ui/components/ThemedText';
import { Colors } from '@/ui/theme/colors';
import { HomeScreen } from '@/ui/screens/HomeScreen';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
```

**Alias Mapping:**
- `@/ui/*` - All UI components, screens, navigation, and theme
- `@/domain/*` - Business logic and entities
- `@/data/*` - Repositories and data sources
- `@/core/*` - Shared hooks, utilities, and constants

## Development Workflow

### Running the App
- `npm start` - Start Expo dev server with Metro bundler
- `npm run ios` - Launch iOS simulator
- `npm run android` - Launch Android emulator  
- `npm run web` - Start web server
- Dev tools: `cmd+d` (iOS), `cmd+m` (Android), `F12` (web)

### Restarting Metro Bundler
After changing `babel.config.js`, always restart with cache clear:
```bash
npm start -- --clear
```

### Code Quality
- ESLint flat config (v9) with `eslint-config-expo`
- TypeScript strict mode enabled
- Lint: `npm run lint`

### Project Structure Migration
If migrating from Expo Router template:
- `npm run reset-project` - Moves template code to `app-example/`
- Restructure code into clean architecture folders (`src/ui/`, `src/domain/`, `src/data/`)
- Replace Expo Router with React Navigation setup

## Platform-Specific Considerations

### iOS
- Haptic feedback on tab press: Use `expo-haptics` with `HapticTab` wrapper component
- SF Symbols via `expo-symbols` (iOS 13+)
- Tab bar and edge-to-edge support automatic

### Android
- Adaptive icons configured in `app.json` with foreground, background, monochrome images
- Edge-to-edge mode enabled, predictive back gesture disabled
- Material Icons fallback for symbols

### Web
- Static output configured (`web.output: "static"`)
- Uses `react-native-web` for cross-platform components
- Platform detection: `Platform.select({ ios, android, web })`

## Key Dependencies
- **Navigation**: @react-navigation/native, @react-navigation/bottom-tabs, @react-navigation/native-stack, @react-navigation/elements
- **UI**: expo-symbols, @expo/vector-icons, expo-image (optimized Image component)
- **Animations**: react-native-reanimated, react-native-gesture-handler
- **Module Resolution**: babel-plugin-module-resolver (for alias support)
- **Utilities**: expo-haptics, expo-linking, expo-web-browser

## Configuration Files

### `babel.config.js`
Configures module resolution and Babel plugins:
```javascript
module.exports = {
  plugins: [
    ['module-resolver', { alias: { '@': './src' } }],
    'react-native-reanimated/plugin',
  ],
};
```

### `tsconfig.json`
Configures TypeScript path aliases and compiler options:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## Experimental Features
- `experiments.reactCompiler: true` - Automatic optimization (React 19)
- New Architecture enabled for better performance

## Asset Management
- Images in `assets/images/` - Use `require('@/assets/images/...')` or expo-image
- Icon assets for iOS/Android adaptive icons configured in `app.json`
- Splash screen configuration in Expo plugins array

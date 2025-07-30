# WaveSurfer Store Architecture

This directory contains a modern, scalable state management solution for WaveSurfer.js using Zustand. It replaces the previous `useWaveform` hook with a cleaner, more maintainable architecture.

## 🎯 Key Benefits

- **Scalable**: Easy to add new features without modifying existing code
- **Developer-friendly**: Clean API surface with excellent TypeScript support
- **Testable**: Business logic separated from React components
- **Maintainable**: Clear separation of concerns
- **Reusable**: Store can be used across multiple components
- **Audio Extraction**: Intelligent region cutting for high-resolution analysis

## 📁 Structure

```
src/shared/stores/wavesurfer/
├── index.ts          # Main exports
├── types.ts          # TypeScript interfaces
├── store.ts          # Zustand store implementation
├── actions.ts        # High-level actions and region handlers
├── regionColors.ts   # Color management for regions
├── hooks.ts          # React hooks for UI integration
└── README.md         # This documentation
```

## 🚀 Quick Start

### Basic Usage

```tsx
import { useWaveSurfer } from '@/shared/stores/wavesurfer';

function AudioComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const {
    isLoaded,
    isPlaying,
    playPause,
    clearRegions,
    setupMain,
  } = useWaveSurfer();

  useEffect(() => {
    if (containerRef.current && audioRef.current) {
      setupMain(containerRef.current, audioRef.current);
    }
  }, [setupMain]);

  return (
    <div>
      <audio ref={audioRef} src="audio.wav" />
      <div ref={containerRef} />
      <button onClick={playPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button onClick={clearRegions}>Clear Regions</button>
    </div>
  );
}
```

### Advanced Usage

```tsx
import { useWaveSurfer, useWaveSurferConfig } from '@/shared/stores/wavesurfer';
import { Region } from 'wavesurfer.js/dist/plugins/regions';

function AdvancedAudioComponent() {
  const { setConfig } = useWaveSurferConfig();
  
  const {
    selectedRegion,
    removeRegion,
    setupMain,
    setupCropped,
  } = useWaveSurfer({
    onRegionCreated: (region) => console.log('Region created:', region),
    onRegionSelected: (region) => console.log('Region selected:', region),
  });

  // Customize appearance
  useEffect(() => {
    setConfig({
      waveColor: '#ff6b6b',
      progressColor: '#4ecdc4',
      height: 150,
    });
  }, [setConfig]);

  return (
    <div>
      {/* Main waveform */}
      <div ref={containerRef} />
      
      {/* Cropped view for selected region */}
      {selectedRegion.region && (
        <div>
          <h3>Selected Region Details</h3>
          <div ref={croppedRef} />
          <button onClick={() => removeRegion(selectedRegion.region!)}>
            Remove Region
          </button>
        </div>
      )}
    </div>
  );
}
```

## 🎨 Available Hooks

### `useWaveSurfer(callbacks?)`
Main hook providing complete WaveSurfer functionality.

**Returns:**
- `isInitialized`, `isMainReady`, `isCroppedReady` - Initialization states
- `isPlaying`, `isLoaded` - Playback states  
- `selectedRegion` - Currently selected region
- `mainWaveSurfer`, `croppedWaveSurfer` - Direct access to instances
- `playPause()`, `clearRegions()`, `removeRegion()` - Actions
- `setupMain()`, `setupCropped()` - Setup functions

### `useWaveSurferState()`
Read-only access to store state. Useful for components that only observe.

### `useWaveSurferActions()`
Action-only access. Useful for components that only trigger operations.

### `useWaveSurferConfig()`
Configuration management for dynamic customization.

## 🔧 Store Architecture

### State Structure
```typescript
interface WaveSurferState {
  // WaveSurfer instances
  mainWaveSurfer: WaveSurfer | null;
  croppedWaveSurfer: WaveSurfer | null;
  
  // State
  playbackState: PlaybackState;
  initializationState: InitializationState;
  selectedRegion: SelectedRegion; // Includes extracted audio data
  
  // Configuration
  config: WaveSurferConfig;
  spectrogramConfig: SpectrogramConfig;
}

interface SelectedRegion {
  region: Region | null;
  start?: number;
  end?: number;
  extractedAudioBlob?: Blob;      // 🆕 Extracted audio data
  extractedAudioUrl?: string;     // 🆕 Blob URL for extracted audio
  isExtracting?: boolean;         // 🆕 Extraction progress state
  extractionError?: string;       // 🆕 Error handling
}
```

### Actions
The store provides actions for:
- **Initialization**: `initializeMain()`, `initializeCropped()`
- **Playback**: `play()`, `pause()`, `playPause()`, `seekTo()`
- **Region Management**: `selectRegion()`, `clearRegions()`, `removeRegion()`
- **Audio Extraction**: `extractRegionAudio()`, `clearExtractedAudio()` 🆕
- **Region Playback**: `playExtractedRegion()` 🆕
- **Configuration**: `setConfig()`, `setSpectrogramConfig()`

## 🎭 Region Management

### Automatic Color Assignment
Regions are automatically assigned colors from a predefined palette:

```typescript
import { REGION_COLORS } from '@/shared/stores/wavesurfer';

// Available colors: red, green, blue, yellow, magenta, cyan, orange, purple
```

### Event Handling
Region events are handled automatically:
- **Creation**: Auto-assigns color, selects region, triggers audio extraction
- **Update**: Updates selected region if it's the current one
- **Click**: Selects the clicked region, starts audio extraction
- **Audio Extraction**: Automatically cuts audio data and creates new waveform

### 🔪 Audio Extraction Process

When a region is selected, the system automatically:

1. **Validates** the time range (minimum 1ms, maximum 1 hour)
2. **Extracts** audio data using Web Audio API
3. **Creates** a WAV blob containing only the selected region
4. **Generates** a new waveform and spectrogram from the extracted audio
5. **Displays** extraction status with visual feedback

```typescript
// The extraction happens automatically, but you can monitor the process:
const { selectedRegion } = useWaveSurferState();

if (selectedRegion.isExtracting) {
  console.log('🔄 Extracting audio...');
}

if (selectedRegion.extractedAudioUrl) {
  console.log('✅ Audio extracted successfully');
}

if (selectedRegion.extractionError) {
  console.error('❌ Extraction failed:', selectedRegion.extractionError);
}
```

### Benefits of Audio Extraction

- **High Resolution**: No stretching artifacts for small regions
- **Performance**: Prevents crashes with very small time ranges
- **Quality**: Full audio fidelity maintained in extracted regions
- **Analysis**: Better spectrogram detail for precise audio analysis
- **Region Playback**: Play extracted audio regions independently 🆕
- **Error Recovery**: Automatic error clearing when selecting new regions 🆕

### 🎮 **Region Controls**

The region details panel now includes dedicated controls with synchronized playback:

- **▶️ Play Region / ⏸️ Pause Region**: Synced with cropped WaveSurfer player
- **🗑️ Remove Region**: Removes the selected region from the waveform
- **🔄 Status Indicators**: Real-time feedback during audio extraction
- **📍 Visual Playback Indicators**: Shows active playback in the cropped view

#### **Synchronized Playback Features**:
- Button automatically switches between Play (▶️) and Pause (⏸️) states
- Progress cursor moves through the cropped waveform during playback

These controls only appear when a region is selected, keeping the interface clean and contextual.

## 🧪 Testing

The new architecture makes testing much easier:

```typescript
import { useWaveSurferStore } from '@/shared/stores/wavesurfer';

// Test store directly
test('should update playback state', () => {
  const store = useWaveSurferStore.getState();
  store.updatePlaybackState({ isPlaying: true });
  
  expect(store.playbackState.isPlaying).toBe(true);
});

// Test actions
test('should clear regions', () => {
  const store = useWaveSurferStore.getState();
  store.clearRegions();
  
  expect(store.selectedRegion.region).toBeNull();
});
```

## 🔄 Migration from useWaveform

The old `useWaveform` hook has been replaced but a compatibility layer is provided:

```tsx
// Old way (still works but deprecated)
import { useWaveform } from '@/shared/stores/wavesurfer';

// New way (recommended)
import { useWaveSurfer } from '@/shared/stores/wavesurfer';
```

### Key Differences

| Old `useWaveform` | New `useWaveSurfer` |
|-------------------|---------------------|
| `containerRef` | Manual ref management |
| `initialize()` | `setupMain()` |
| `wavesurfer` | `mainWaveSurfer` |
| Mixed state/logic | Separated concerns |
| Hard to test | Easy to test |
| Tightly coupled | Loosely coupled |

## 🎯 Best Practices

1. **Use specific hooks**: Use `useWaveSurferState()` for read-only components
2. **Avoid direct store access**: Use hooks instead of `useWaveSurferStore.getState()`
3. **Handle cleanup**: The hooks handle cleanup automatically
4. **Type safety**: Always use TypeScript interfaces provided
5. **Performance**: Use `useShallow()` selector for complex state

## 🐛 Debugging

The store includes Redux DevTools support for debugging:

1. Install Redux DevTools extension
2. Open browser DevTools
3. Go to Redux tab
4. Monitor store state changes in real-time

## 📈 Performance

- **Shallow selectors**: Prevents unnecessary re-renders
- **Action separation**: Only subscribe to what you need
- **Memoized callbacks**: Actions are stable between renders
- **Lazy initialization**: WaveSurfer instances created only when needed

## 🔮 Future Enhancements

The architecture is designed for easy extension:
- Add new audio formats support
- Implement undo/redo functionality  
- Add keyboard shortcuts
- Create plugin system for custom visualizations
- Add collaborative editing features

## 💡 Examples

See the `RegionWaveform` component for a complete implementation example.
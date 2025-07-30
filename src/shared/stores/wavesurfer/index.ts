// Main exports for the WaveSurfer store
export { useWaveSurferStore } from './store';
export {
  useWaveSurfer,
  useWaveSurferState,
  useWaveSurferActions,
  useWaveSurferConfig,
  useWaveform // Legacy compatibility
} from './hooks';
export { waveSurferActions } from './actions';
export { RegionColorManager, REGION_COLORS } from './regionColors';

// Type exports
export type {
  WaveSurferConfig,
  SpectrogramConfig,
  SelectedRegion,
  PlaybackState,
  InitializationState,
  RegionEventCallbacks,
  WaveSurferState,
  WaveSurferActions,
  WaveSurferStore,
  UseWaveSurferReturn,
} from './types';
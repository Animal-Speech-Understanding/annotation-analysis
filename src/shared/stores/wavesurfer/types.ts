import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { Region } from 'wavesurfer.js/dist/plugins/regions';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram';

/**
 * Configuration options for initializing WaveSurfer
 */
export interface WaveSurferConfig {
  waveColor?: string;
  progressColor?: string;
  height?: number;
  dragToSeek?: boolean;
}

/**
 * Configuration for spectrogram visualization
 */
export interface SpectrogramConfig {
  labels?: boolean;
  height?: number;
  splitChannels?: boolean;
  scale?: 'linear' | 'mel' | 'logarithmic' | 'bark' | 'erb';
  frequencyMax?: number;
  frequencyMin?: number;
  fftSamples?: number;
  labelsBackground?: string;
}

/**
 * Information about a selected audio region
 */
export interface SelectedRegion {
  region: Region | null;
  start?: number;
  end?: number;
}

/**
 * Playback state information
 */
export interface PlaybackState {
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
}

/**
 * Initialization state of WaveSurfer instances
 */
export interface InitializationState {
  isInitialized: boolean;
  isMainReady: boolean;
  isCroppedReady: boolean;
  error: string | null;
}

/**
 * Event callbacks for region operations
 */
export interface RegionEventCallbacks {
  onRegionCreated?: (region: Region) => void;
  onRegionSelected?: (region: Region | null) => void;
  onRegionRemoved?: (region: Region) => void;
  onRegionUpdated?: (region: Region) => void;
}

/**
 * Main WaveSurfer store state interface
 */
export interface WaveSurferState {
  // WaveSurfer instances
  mainWaveSurfer: WaveSurfer | null;
  croppedWaveSurfer: WaveSurfer | null;

  // Plugins
  regionsPlugin: ReturnType<typeof RegionsPlugin.create> | null;
  spectrogramPlugin: Spectrogram | null;

  // DOM References (managed externally)
  mainContainer: HTMLDivElement | null;
  croppedContainer: HTMLDivElement | null;
  audioElement: HTMLAudioElement | null;

  // State
  playbackState: PlaybackState;
  initializationState: InitializationState;
  selectedRegion: SelectedRegion;

  // Configuration
  config: WaveSurferConfig;
  spectrogramConfig: SpectrogramConfig;

  // Event callbacks
  callbacks: RegionEventCallbacks;
}

/**
 * WaveSurfer store actions interface
 */
export interface WaveSurferActions {
  // Initialization
  initializeMain: (container: HTMLDivElement, audioElement: HTMLAudioElement) => Promise<void>;
  initializeCropped: (container: HTMLDivElement) => Promise<void>;
  destroy: () => void;

  // Configuration
  setConfig: (config: Partial<WaveSurferConfig>) => void;
  setSpectrogramConfig: (config: Partial<SpectrogramConfig>) => void;
  setCallbacks: (callbacks: Partial<RegionEventCallbacks>) => void;

  // Playback control
  play: () => void;
  pause: () => void;
  playPause: () => void;
  seekTo: (time: number) => void;

  // Region management
  clearRegions: () => void;
  removeRegion: (region: Region) => void;
  selectRegion: (region: Region | null) => void;

  // Internal state updates
  setMainContainer: (container: HTMLDivElement | null) => void;
  setCroppedContainer: (container: HTMLDivElement | null) => void;
  setAudioElement: (element: HTMLAudioElement | null) => void;
  updatePlaybackState: (state: Partial<PlaybackState>) => void;
  updateInitializationState: (state: Partial<InitializationState>) => void;
  setError: (error: string | null) => void;
}

/**
 * Complete store interface combining state and actions
 */
export type WaveSurferStore = WaveSurferState & WaveSurferActions;

/**
 * Hook return type for UI components
 */
export interface UseWaveSurferReturn {
  // State
  isInitialized: boolean;
  isMainReady: boolean;
  isCroppedReady: boolean;
  isPlaying: boolean;
  isLoaded: boolean;
  error: string | null;
  selectedRegion: SelectedRegion;

  // WaveSurfer instances (for compatibility)
  mainWaveSurfer: WaveSurfer | null;
  croppedWaveSurfer: WaveSurfer | null;

  // Actions
  playPause: () => void;
  clearRegions: () => void;
  removeRegion: (region: Region) => void;

  // Setup functions
  setupMain: (container: HTMLDivElement, audioElement: HTMLAudioElement) => void;
  setupCropped: (container: HTMLDivElement) => void;
}
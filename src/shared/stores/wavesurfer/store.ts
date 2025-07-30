import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram';
import {
  WaveSurferStore,
  WaveSurferConfig,
  SpectrogramConfig,
  PlaybackState,
  InitializationState,
  SelectedRegion,
} from './types';
import {
  extractAudioRegion,
  createAudioBlobURL,
  revokeBlobURL,
  validateTimeRange
} from './audioUtils';

// Forward declare to avoid circular dependency
let resetEventListeners: (() => void) | null = null;

export const setEventListenersReset = (resetFn: () => void) => {
  resetEventListeners = resetFn;
};

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: WaveSurferConfig = {
  waveColor: 'violet',
  progressColor: 'purple',
  height: 100,
  dragToSeek: true,
};

const DEFAULT_SPECTROGRAM_CONFIG: SpectrogramConfig = {
  labels: true,
  height: 800,
  splitChannels: false,
  scale: 'linear',
  frequencyMax: 4000,
  frequencyMin: 0,
  fftSamples: 512,
  labelsBackground: 'rgba(0, 0, 0, 0.1)',
};

const DEFAULT_PLAYBACK_STATE: PlaybackState = {
  isPlaying: false,
  isLoaded: false,
  currentTime: 0,
  duration: 0,
};

const DEFAULT_INITIALIZATION_STATE: InitializationState = {
  isInitialized: false,
  isMainReady: false,
  isCroppedReady: false,
  error: null,
};

const DEFAULT_SELECTED_REGION: SelectedRegion = {
  region: null,
  start: undefined,
  end: undefined,
  extractedAudioBlob: undefined,
  extractedAudioUrl: undefined,
  isExtracting: false,
  extractionError: undefined,
  isPlayingRegion: false,
};

/**
 * WaveSurfer store implementation using Zustand
 * 
 * Provides a centralized, scalable state management solution for WaveSurfer.js
 * Features:
 * - Clean separation of concerns
 * - Type-safe interface
 * - DevTools support for debugging
 * - Easy to test and extend
 */
export const useWaveSurferStore = create<WaveSurferStore>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        // Initial state
        mainWaveSurfer: null,
        croppedWaveSurfer: null,
        regionsPlugin: null,
        spectrogramPlugin: null,
        mainContainer: null,
        croppedContainer: null,
        audioElement: null,
        playbackState: { ...DEFAULT_PLAYBACK_STATE },
        initializationState: { ...DEFAULT_INITIALIZATION_STATE },
        selectedRegion: { ...DEFAULT_SELECTED_REGION },
        config: { ...DEFAULT_CONFIG },
        spectrogramConfig: { ...DEFAULT_SPECTROGRAM_CONFIG },
        callbacks: {},

        // Configuration actions
        setConfig: (newConfig) =>
          set(
            (state) => ({
              config: { ...state.config, ...newConfig },
            }),
            false,
            'setConfig'
          ),

        setSpectrogramConfig: (newConfig) =>
          set(
            (state) => ({
              spectrogramConfig: { ...state.spectrogramConfig, ...newConfig },
            }),
            false,
            'setSpectrogramConfig'
          ),

        setCallbacks: (newCallbacks) =>
          set(
            (state) => ({
              callbacks: { ...state.callbacks, ...newCallbacks },
            }),
            false,
            'setCallbacks'
          ),

        // DOM references
        setMainContainer: (container) =>
          set({ mainContainer: container }, false, 'setMainContainer'),

        setCroppedContainer: (container) =>
          set({ croppedContainer: container }, false, 'setCroppedContainer'),

        setAudioElement: (element) =>
          set({ audioElement: element }, false, 'setAudioElement'),

        // State updates
        updatePlaybackState: (newState) =>
          set(
            (state) => ({
              playbackState: { ...state.playbackState, ...newState },
            }),
            false,
            'updatePlaybackState'
          ),

        updateInitializationState: (newState) =>
          set(
            (state) => ({
              initializationState: { ...state.initializationState, ...newState },
            }),
            false,
            'updateInitializationState'
          ),

        setError: (error) =>
          set(
            (state) => ({
              initializationState: { ...state.initializationState, error },
            }),
            false,
            'setError'
          ),

        // Region management
        selectRegion: (region) => {
          const { callbacks, selectedRegion: currentSelection } = get();

          // Clean up previous extracted audio URL
          if (currentSelection.extractedAudioUrl) {
            revokeBlobURL(currentSelection.extractedAudioUrl);
          }

          // Clear any existing errors when selecting a new region
          set(
            (state) => ({
              selectedRegion: region
                ? {
                  region,
                  start: region.start,
                  end: region.end,
                  extractedAudioBlob: undefined,
                  extractedAudioUrl: undefined,
                  isExtracting: false,
                  extractionError: undefined,
                  isPlayingRegion: false,
                }
                : { ...DEFAULT_SELECTED_REGION },
              initializationState: {
                ...state.initializationState,
                error: null, // Clear any previous errors
              },
            }),
            false,
            'selectRegion'
          );

          // Trigger callback
          if (callbacks.onRegionSelected) {
            callbacks.onRegionSelected(region);
          }

          // Automatically extract audio for the selected region
          if (region) {
            get().extractRegionAudio(region);
          }
        },

        clearRegions: () => {
          const { regionsPlugin } = get();

          regionsPlugin?.clearRegions();
          get().selectRegion(null);

          // Reset color manager if needed
          // This will be handled in the region handlers
        },

        removeRegion: (region) => {
          const { callbacks, selectedRegion } = get();

          region.remove();

          if (callbacks.onRegionRemoved) {
            callbacks.onRegionRemoved(region);
          }

          if (selectedRegion.region?.id === region.id) {
            get().selectRegion(null);
          }
        },

        // Playback control
        play: () => {
          const { mainWaveSurfer } = get();
          if (mainWaveSurfer) {
            mainWaveSurfer.play();
          }
        },

        pause: () => {
          const { mainWaveSurfer } = get();
          if (mainWaveSurfer) {
            mainWaveSurfer.pause();
          }
        },

        playPause: () => {
          const { mainWaveSurfer, initializationState } = get();

          if (!initializationState.isInitialized && !mainWaveSurfer) {
            // Initialize if not already done
            const { mainContainer, audioElement } = get();
            if (mainContainer && audioElement) {
              get().initializeMain(mainContainer, audioElement);
            }
          } else if (mainWaveSurfer) {
            mainWaveSurfer.playPause();
          }
        },

        seekTo: (time) => {
          const { mainWaveSurfer } = get();
          if (mainWaveSurfer) {
            mainWaveSurfer.seekTo(time / mainWaveSurfer.getDuration());
          }
        },

        // Initialization
        initializeMain: async (container, audioElement) => {
          const { config, regionsPlugin } = get();

          try {
            set(
              (state) => ({
                mainContainer: container,
                audioElement: audioElement,
                initializationState: {
                  ...state.initializationState,
                  error: null,
                },
              }),
              false,
              'initializeMain:start'
            );

            // Create regions plugin if not exists
            let regions = regionsPlugin;
            if (!regions) {
              regions = RegionsPlugin.create();
              set({ regionsPlugin: regions }, false, 'initializeMain:regionsPlugin');
            }

            // Create main WaveSurfer instance
            const wavesurfer = WaveSurfer.create({
              container,
              media: audioElement,
              waveColor: config.waveColor,
              progressColor: config.progressColor,
              height: config.height,
              backend: 'MediaElement',
              dragToSeek: config.dragToSeek,
              plugins: [regions],
            });

            set({ mainWaveSurfer: wavesurfer }, false, 'initializeMain:instance');

            // Set up event listeners
            wavesurfer.on('ready', () => {
              set(
                (state) => ({
                  playbackState: { ...state.playbackState, isLoaded: true },
                  initializationState: { ...state.initializationState, isMainReady: true },
                }),
                false,
                'initializeMain:ready'
              );
            });

            wavesurfer.on('play', () => {
              set(
                (state) => ({
                  playbackState: { ...state.playbackState, isPlaying: true },
                }),
                false,
                'initializeMain:play'
              );
            });

            wavesurfer.on('pause', () => {
              set(
                (state) => ({
                  playbackState: { ...state.playbackState, isPlaying: false },
                }),
                false,
                'initializeMain:pause'
              );
            });

            wavesurfer.on('timeupdate', (currentTime) => {
              set(
                (state) => ({
                  playbackState: { ...state.playbackState, currentTime },
                }),
                false,
                'initializeMain:timeupdate'
              );
            });

            // Set up region event listeners
            // This will be handled by region handlers that can be injected

            set(
              (state) => ({
                initializationState: {
                  ...state.initializationState,
                  isInitialized: true,
                },
              }),
              false,
              'initializeMain:complete'
            );

          } catch (error) {
            console.error('Failed to initialize main WaveSurfer:', error);
            set(
              (state) => ({
                initializationState: {
                  ...state.initializationState,
                  error: error instanceof Error ? error.message : 'Unknown error',
                },
              }),
              false,
              'initializeMain:error'
            );
          }
        },

        initializeCropped: async (container) => {
          const { audioElement, spectrogramConfig, selectedRegion } = get();

          // Use extracted audio if available, otherwise fall back to original audio element
          const audioSource = selectedRegion.extractedAudioUrl || audioElement;

          if (!audioSource) {
            console.warn('Cannot initialize cropped WaveSurfer without audio source');
            return;
          }

          try {
            set(
              (state) => ({
                croppedContainer: container,
                initializationState: {
                  ...state.initializationState,
                  isCroppedReady: false,
                  error: null, // Clear any previous errors when initializing
                },
              }),
              false,
              'initializeCropped:start'
            );

            // Destroy existing cropped WaveSurfer if it exists
            const { croppedWaveSurfer: existingCropped } = get();
            if (existingCropped) {
              existingCropped.destroy();
            }

            // Create audio element for extracted audio if using blob URL
            let mediaElement: HTMLAudioElement;
            if (selectedRegion.extractedAudioUrl) {
              // Create a new audio element for the extracted audio
              const extractedAudio = new Audio(selectedRegion.extractedAudioUrl);
              extractedAudio.crossOrigin = 'anonymous';
              mediaElement = extractedAudio;
            } else if (audioElement) {
              mediaElement = audioElement;
            } else {
              throw new Error('No audio element available for cropped WaveSurfer');
            }

            const croppedWaveSurfer = WaveSurfer.create({
              container,
              media: mediaElement,
              waveColor: '#ddd',
              progressColor: '#555',
              backend: 'MediaElement',
              autoCenter: false,
              autoScroll: false,
              hideScrollbar: true,
            });

            // Add spectrogram plugin
            const spectrogramPlugin = Spectrogram.create(spectrogramConfig);
            croppedWaveSurfer.registerPlugin(spectrogramPlugin);

            set(
              {
                croppedWaveSurfer,
                spectrogramPlugin,
              },
              false,
              'initializeCropped:instance'
            );

            croppedWaveSurfer.on('ready', () => {
              set(
                (state) => ({
                  initializationState: {
                    ...state.initializationState,
                    isCroppedReady: true,
                  },
                }),
                false,
                'initializeCropped:ready'
              );
            });

            // Set up region playback event listeners
            croppedWaveSurfer.on('play', () => {
              set(
                (state) => ({
                  selectedRegion: {
                    ...state.selectedRegion,
                    isPlayingRegion: true,
                  },
                }),
                false,
                'initializeCropped:play'
              );
            });

            croppedWaveSurfer.on('pause', () => {
              set(
                (state) => ({
                  selectedRegion: {
                    ...state.selectedRegion,
                    isPlayingRegion: false,
                  },
                }),
                false,
                'initializeCropped:pause'
              );
            });

            croppedWaveSurfer.on('finish', () => {
              set(
                (state) => ({
                  selectedRegion: {
                    ...state.selectedRegion,
                    isPlayingRegion: false,
                  },
                }),
                false,
                'initializeCropped:finish'
              );
            });

            croppedWaveSurfer.on('error', (error) => {
              console.error('Cropped WaveSurfer error:', error);
              set(
                (state) => ({
                  initializationState: {
                    ...state.initializationState,
                    error: `Cropped WaveSurfer error: ${error}`,
                  },
                }),
                false,
                'initializeCropped:wavesurfer-error'
              );
            });

          } catch (error) {
            console.error('Failed to initialize cropped WaveSurfer:', error);
            set(
              (state) => ({
                initializationState: {
                  ...state.initializationState,
                  error: error instanceof Error ? error.message : 'Unknown error',
                },
              }),
              false,
              'initializeCropped:error'
            );
          }
        },

        destroy: () => {
          const { mainWaveSurfer, croppedWaveSurfer, selectedRegion } = get();

          // Clean up blob URL if it exists
          if (selectedRegion.extractedAudioUrl) {
            revokeBlobURL(selectedRegion.extractedAudioUrl);
          }

          // Clean up event listeners if they exist
          if (resetEventListeners) {
            try {
              resetEventListeners();
            } catch (error) {
              console.warn('Failed to cleanup region event listeners:', error);
            }
          }

          if (mainWaveSurfer) {
            mainWaveSurfer.destroy();
          }

          if (croppedWaveSurfer) {
            croppedWaveSurfer.destroy();
          }

          set(
            {
              mainWaveSurfer: null,
              croppedWaveSurfer: null,
              regionsPlugin: null,
              spectrogramPlugin: null,
              mainContainer: null,
              croppedContainer: null,
              audioElement: null,
              playbackState: { ...DEFAULT_PLAYBACK_STATE },
              initializationState: { ...DEFAULT_INITIALIZATION_STATE },
              selectedRegion: { ...DEFAULT_SELECTED_REGION },
            },
            false,
            'destroy'
          );
        },

        // Audio extraction methods
        extractRegionAudio: async (region) => {
          const { audioElement } = get();

          if (!audioElement) {
            console.error('Cannot extract audio: no audio element available');
            return;
          }

          // Validate the time range
          const validation = validateTimeRange(
            region.start,
            region.end,
            audioElement.duration || 0
          );

          if (!validation.isValid) {
            set(
              (state) => ({
                selectedRegion: {
                  ...state.selectedRegion,
                  extractionError: validation.error,
                  isExtracting: false,
                },
              }),
              false,
              'extractRegionAudio:validation-error'
            );
            return;
          }

          // Set extracting state
          set(
            (state) => ({
              selectedRegion: {
                ...state.selectedRegion,
                isExtracting: true,
                extractionError: undefined,
              },
            }),
            false,
            'extractRegionAudio:start'
          );

          try {
            // Extract the audio data
            const audioBlob = await extractAudioRegion(
              audioElement,
              region.start,
              region.end
            );

            // Create a blob URL for the extracted audio
            const audioUrl = createAudioBlobURL(audioBlob);

            // Update the selected region with the extracted audio
            set(
              (state) => ({
                selectedRegion: {
                  ...state.selectedRegion,
                  extractedAudioBlob: audioBlob,
                  extractedAudioUrl: audioUrl,
                  isExtracting: false,
                  extractionError: undefined,
                },
              }),
              false,
              'extractRegionAudio:success'
            );

            // Recreate the cropped WaveSurfer with the extracted audio
            const { croppedContainer } = get();
            if (croppedContainer) {
              get().initializeCropped(croppedContainer);
            }

          } catch (error) {
            console.error('Failed to extract audio region:', error);

            set(
              (state) => ({
                selectedRegion: {
                  ...state.selectedRegion,
                  isExtracting: false,
                  extractionError: error instanceof Error ? error.message : 'Unknown extraction error',
                },
              }),
              false,
              'extractRegionAudio:error'
            );
          }
        },

        clearExtractedAudio: () => {
          const { selectedRegion } = get();

          if (selectedRegion.extractedAudioUrl) {
            revokeBlobURL(selectedRegion.extractedAudioUrl);
          }

          set(
            (state) => ({
              selectedRegion: {
                ...state.selectedRegion,
                extractedAudioBlob: undefined,
                extractedAudioUrl: undefined,
                isExtracting: false,
                extractionError: undefined,
              },
            }),
            false,
            'clearExtractedAudio'
          );
        },

        // Region playback
        playExtractedRegion: async () => {
          const { selectedRegion, croppedWaveSurfer } = get();

          if (!selectedRegion.extractedAudioUrl) {
            console.warn('Cannot play region: no extracted audio available');
            return;
          }

          if (!croppedWaveSurfer) {
            console.warn('Cannot play region: cropped WaveSurfer not available');
            return;
          }

          try {
            // If already playing, pause first
            if (selectedRegion.isPlayingRegion) {
              croppedWaveSurfer.pause();
              return;
            }

            // Play the cropped WaveSurfer (which contains the extracted audio)
            await croppedWaveSurfer.play();
            console.log('Playing extracted audio region via cropped WaveSurfer');
          } catch (error) {
            console.error('Failed to play extracted audio region:', error);

            set(
              (state) => ({
                initializationState: {
                  ...state.initializationState,
                  error: `Failed to play region: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              }),
              false,
              'playExtractedRegion:error'
            );
          }
        },

        pauseExtractedRegion: () => {
          const { croppedWaveSurfer } = get();

          if (!croppedWaveSurfer) {
            console.warn('Cannot pause region: cropped WaveSurfer not available');
            return;
          }

          try {
            croppedWaveSurfer.pause();
            console.log('Paused extracted audio region');
          } catch (error) {
            console.error('Failed to pause extracted audio region:', error);
          }
        },
      })
    ),
    {
      name: 'wavesurfer-store',
    }
  )
);
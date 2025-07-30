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
          const { callbacks } = get();

          set(
            {
              selectedRegion: region
                ? { region, start: region.start, end: region.end }
                : { ...DEFAULT_SELECTED_REGION },
            },
            false,
            'selectRegion'
          );

          // Trigger callback
          if (callbacks.onRegionSelected) {
            callbacks.onRegionSelected(region);
          }

          // Handle cropped WaveSurfer zoom and scroll
          const { croppedWaveSurfer, croppedContainer } = get();
          if (region && croppedWaveSurfer && croppedContainer) {
            const duration = region.end - region.start;
            if (duration > 0) {
              const width = croppedContainer.clientWidth;
              if (width > 0) {
                const pxPerSec = width / duration;
                croppedWaveSurfer.zoom(pxPerSec);
                croppedWaveSurfer.setScrollTime(region.start);
              }
            } else {
              croppedWaveSurfer.zoom(1);
              croppedWaveSurfer.setScrollTime(0);
            }
          } else if (!region && croppedWaveSurfer) {
            croppedWaveSurfer.zoom(1);
            croppedWaveSurfer.setScrollTime(0);
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
          const { audioElement, spectrogramConfig } = get();

          if (!audioElement) {
            console.warn('Cannot initialize cropped WaveSurfer without audio element');
            return;
          }

          try {
            set(
              { croppedContainer: container },
              false,
              'initializeCropped:start'
            );

            const croppedWaveSurfer = WaveSurfer.create({
              container,
              media: audioElement,
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
          const { mainWaveSurfer, croppedWaveSurfer } = get();

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
      })
    ),
    {
      name: 'wavesurfer-store',
    }
  )
);
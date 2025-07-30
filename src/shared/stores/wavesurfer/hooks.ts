import { useEffect, useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Region } from 'wavesurfer.js/dist/plugins/regions';
import { useWaveSurferStore } from './store';
import { waveSurferActions } from './actions';
import { UseWaveSurferReturn, RegionEventCallbacks } from './types';

/**
 * Main hook for WaveSurfer functionality
 * 
 * This replaces the old useWaveform hook with a much cleaner and more scalable API.
 * 
 * Features:
 * - Automatic cleanup on unmount
 * - Type-safe interface
 * - Separated concerns (no business logic in the hook)
 * - Easy to test and extend
 * 
 * @param callbacks - Optional event callbacks for region operations
 * @returns Clean interface for WaveSurfer operations
 */
export const useWaveSurfer = (callbacks?: RegionEventCallbacks): UseWaveSurferReturn => {
  const containerRef = useRef<HTMLDivElement>(null);
  const croppedContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Use shallow selector for performance
  const {
    mainWaveSurfer,
    croppedWaveSurfer,
    playbackState,
    initializationState,
    selectedRegion,
    setCallbacks,
    playPause: storePlayPause,
    removeRegion: storeRemoveRegion,
    destroy,
  } = useWaveSurferStore(
    useShallow((state) => ({
      mainWaveSurfer: state.mainWaveSurfer,
      croppedWaveSurfer: state.croppedWaveSurfer,
      playbackState: state.playbackState,
      initializationState: state.initializationState,
      selectedRegion: state.selectedRegion,
      setCallbacks: state.setCallbacks,
      playPause: state.playPause,
      removeRegion: state.removeRegion,
      destroy: state.destroy,
    }))
  );

  // Set callbacks on mount/change
  useEffect(() => {
    if (callbacks) {
      setCallbacks(callbacks);
    }
  }, [callbacks, setCallbacks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  // Setup functions
  const setupMain = useCallback(
    (container: HTMLDivElement, audioElement: HTMLAudioElement) => {
      containerRef.current = container;
      audioRef.current = audioElement;
      waveSurferActions.initializeMainWithRegions(container, audioElement);
    },
    []
  );

  const setupCropped = useCallback((container: HTMLDivElement) => {
    croppedContainerRef.current = container;
    if (audioRef.current) {
      const store = useWaveSurferStore.getState();
      store.initializeCropped(container);
    }
  }, []);

  // Action wrappers
  const playPause = useCallback(() => {
    storePlayPause();
  }, [storePlayPause]);

  const clearRegions = useCallback(() => {
    waveSurferActions.clearAll();
  }, []);

  const removeRegion = useCallback(
    (region: Region) => {
      storeRemoveRegion(region);
    },
    [storeRemoveRegion]
  );

  return {
    // State
    isInitialized: initializationState.isInitialized,
    isMainReady: initializationState.isMainReady,
    isCroppedReady: initializationState.isCroppedReady,
    isPlaying: playbackState.isPlaying,
    isLoaded: playbackState.isLoaded,
    error: initializationState.error,
    selectedRegion,

    // WaveSurfer instances (for compatibility with existing code)
    mainWaveSurfer,
    croppedWaveSurfer,

    // Actions
    playPause,
    clearRegions,
    removeRegion,

    // Setup functions
    setupMain,
    setupCropped,
  };
};

/**
 * Hook for accessing WaveSurfer state without actions
 * Useful for read-only components that only need to observe state
 */
export const useWaveSurferState = () => {
  return useWaveSurferStore(
    useShallow((state) => ({
      isInitialized: state.initializationState.isInitialized,
      isMainReady: state.initializationState.isMainReady,
      isCroppedReady: state.initializationState.isCroppedReady,
      isPlaying: state.playbackState.isPlaying,
      isLoaded: state.playbackState.isLoaded,
      error: state.initializationState.error,
      selectedRegion: state.selectedRegion,
      mainWaveSurfer: state.mainWaveSurfer,
      croppedWaveSurfer: state.croppedWaveSurfer,
    }))
  );
};

/**
 * Hook for accessing WaveSurfer actions without state
 * Useful for components that only need to trigger actions
 */
export const useWaveSurferActions = () => {
  return useWaveSurferStore(
    useShallow((state) => ({
      play: state.play,
      pause: state.pause,
      playPause: state.playPause,
      seekTo: state.seekTo,
      clearRegions: () => waveSurferActions.clearAll(),
      removeRegion: state.removeRegion,
      selectRegion: state.selectRegion,
      reset: () => waveSurferActions.reset(),
    }))
  );
};

/**
 * Hook for advanced WaveSurfer configuration
 * Allows dynamic configuration changes
 */
export const useWaveSurferConfig = () => {
  return useWaveSurferStore(
    useShallow((state) => ({
      config: state.config,
      spectrogramConfig: state.spectrogramConfig,
      setConfig: state.setConfig,
      setSpectrogramConfig: state.setSpectrogramConfig,
    }))
  );
};

/**
 * Legacy compatibility hook
 * Provides the same interface as the old useWaveform hook for easier migration
 * 
 * @deprecated Use useWaveSurfer instead for new code
 */
export const useWaveform = (options?: {
  audioRef?: React.RefObject<HTMLAudioElement>;
  waveColor?: string;
  progressColor?: string;
  height?: number;
  onRegionCreated?: (region: Region) => void;
  onRegionSelected?: (region: Region | null) => void;
  onRegionRemoved?: (region: Region) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const croppedRef = useRef<HTMLDivElement>(null);

  // Extract callbacks from options
  const callbacks: RegionEventCallbacks = {
    onRegionCreated: options?.onRegionCreated,
    onRegionSelected: options?.onRegionSelected,
    onRegionRemoved: options?.onRegionRemoved,
  };

  // Use the new hook
  const waveSurfer = useWaveSurfer(callbacks);

  // Set configuration if provided
  const { setConfig } = useWaveSurferConfig();
  useEffect(() => {
    if (options) {
      const { waveColor, progressColor, height } = options;
      if (waveColor || progressColor || height) {
        setConfig({
          ...(waveColor && { waveColor }),
          ...(progressColor && { progressColor }),
          ...(height && { height }),
        });
      }
    }
  }, [options, setConfig]);

  // Auto-setup when refs are ready
  useEffect(() => {
    if (containerRef.current && options?.audioRef?.current && !waveSurfer.isInitialized) {
      waveSurfer.setupMain(containerRef.current, options.audioRef.current);
    }
  }, [waveSurfer, options?.audioRef]);

  useEffect(() => {
    if (croppedRef.current && !waveSurfer.isCroppedReady && waveSurfer.isMainReady) {
      waveSurfer.setupCropped(croppedRef.current);
    }
  }, [waveSurfer]);

  // Return interface matching the old hook
  return {
    containerRef,
    croppedRef,
    isPlaying: waveSurfer.isPlaying,
    isLoaded: waveSurfer.isLoaded,
    isInitialized: waveSurfer.isInitialized,
    selectedRegion: waveSurfer.selectedRegion,
    initialize: () => {
      if (containerRef.current && options?.audioRef?.current) {
        waveSurfer.setupMain(containerRef.current, options.audioRef.current);
      }
    },
    destroy: () => waveSurferActions.reset(),
    playPause: waveSurfer.playPause,
    clearRegions: waveSurfer.clearRegions,
    removeRegion: waveSurfer.removeRegion,
    updateSelectedRegion: (region: Region | null) => {
      const { selectRegion } = useWaveSurferStore.getState();
      selectRegion(region);
    },
    wavesurfer: waveSurfer.mainWaveSurfer,
    regionsPlugin: useWaveSurferStore.getState().regionsPlugin,
    croppedWaveSurfer: waveSurfer.croppedWaveSurfer,
  };
};
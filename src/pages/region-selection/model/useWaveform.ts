import { useState, useRef, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { Region } from 'wavesurfer.js/dist/plugins/regions';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram'
import { RegionColorManager } from './regionColors';
import { createRegionHandlers } from './regionHandlers';

export interface UseWaveformOptions {
  audioRef: React.RefObject<HTMLAudioElement> | null;
  waveColor?: string;
  progressColor?: string;
  height?: number;
  onRegionCreated?: (region: Region) => void;
  onRegionSelected?: (region: Region | null) => void;
  onRegionRemoved?: (region: Region) => void;
}

export function useWaveform({
  audioRef,
  waveColor = 'violet',
  progressColor = 'purple',
  height = 100,
  onRegionCreated,
  onRegionSelected,
  onRegionRemoved,
}: UseWaveformOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<{ region: Region | null, start?: number, end?: number }>({ region: null, start: undefined, end: undefined });
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer>(null);

  const croppedRef = useRef<HTMLDivElement>(null);
  const croppedWaveSurferRef = useRef<WaveSurfer>(null);

  const regionsPluginRef = useRef<ReturnType<typeof RegionsPlugin.create> | null>(null);

  // Create and store color manager
  const colorManagerRef = useRef<RegionColorManager>(new RegionColorManager());

  // Use a ref for the actual selected region to avoid stale closures
  const selectedRegionRef = useRef<Region | null>(null);

  // Create a combined setter function for selected region + notification
  const updateSelectedRegion = useCallback((region: Region | null) => {
    // Update React state
    setSelectedRegion(region ? { region, start: region.start, end: region.end } : { region: null });

    // Update ref immediately (don't wait for render)
    selectedRegionRef.current = region;

    // Always notify listeners
    if (onRegionSelected) {
      onRegionSelected(region);
    }

    if (region && croppedWaveSurferRef.current && croppedRef.current) {
      const { start, end } = region
      // 1. compute zoom
      const duration = end - start;
      const width = croppedRef.current.clientWidth;
      const pxPerSec = width / duration;

      croppedWaveSurferRef.current.zoom(pxPerSec);

      croppedWaveSurferRef.current.setScrollTime(start);

      requestAnimationFrame(() => {
        if (croppedWaveSurferRef.current) {
          croppedWaveSurferRef.current.seekTo(start / croppedWaveSurferRef.current.getDuration());
        }
      });

    }

  }, [onRegionSelected]);


  // Create regions plugin outside of the initialize callback
  const getRegionsPlugin = useCallback(() => {
    if (!regionsPluginRef.current) {
      regionsPluginRef.current = RegionsPlugin.create();
    }
    return regionsPluginRef.current;
  }, [selectedRegionRef]);

  // Setup and cleanup event listeners
  const setupEventListeners = useCallback(() => {
    const regionsPlugin = regionsPluginRef.current;
    if (!regionsPlugin) return;

    console.log("Setting up event listeners");

    // Get the handlers using the combined update function
    const handlers = createRegionHandlers({
      onRegionCreated,
      onRegionRemoved,
      selectedRegionRef,
      colorManagerRef,
      updateSelectedRegion
    });

    // Registering event handlers
    regionsPlugin.on('region-created', handlers.handleRegionCreated);
    regionsPlugin.on('region-updated', handlers.handleRegionUpdated);
    regionsPlugin.on('region-clicked', handlers.handleRegionClicked);

    // Return cleanup function
    return () => {
      console.log("Cleaning up event listeners");
      regionsPlugin.un('region-created', handlers.handleRegionCreated);
      regionsPlugin.un('region-updated', handlers.handleRegionUpdated);
      regionsPlugin.un('region-clicked', handlers.handleRegionClicked);
    };
  }, [onRegionCreated, onRegionRemoved, updateSelectedRegion]);

  // Initialize the cropped waveform
  const initializeCroppedWaveform = useCallback(() => {
    if (!croppedRef.current || !audioRef?.current) return;

    croppedWaveSurferRef.current = WaveSurfer.create({
      container: croppedRef.current,
      waveColor: '#ddd',
      progressColor: '#555',
      backend: 'MediaElement',
      media: audioRef.current,
      autoCenter: false,
      autoScroll: false,
      hideScrollbar: true,
    });


    croppedWaveSurferRef.current.registerPlugin(
      Spectrogram.create({
        labels: true,
        height: 800,
        splitChannels: false,
        scale: 'linear', // 'mel', 'linear', 'logarithmic', 'bark', 'erb'
        frequencyMax: 4000,
        frequencyMin: 0,
        fftSamples: 512,
        labelsBackground: 'rgba(0, 0, 0, 0.1)',
      }),
    )


    return () => {
      croppedWaveSurferRef.current?.destroy();
    };
  }, [croppedRef, wavesurferRef, selectedRegion]);


  // Initialize waveform on explicit user action
  const initialize = useCallback(() => {
    // Only initialize once
    if (isInitialized || !containerRef.current || !audioRef?.current) return;


    try {
      // Get the regions plugin
      const regionsPlugin = getRegionsPlugin();

      console.log(containerRef.current);

      // Create WaveSurfer instance
      const wavesurfer = WaveSurfer.create({
        container: containerRef.current,
        waveColor,
        progressColor,
        height,
        backend: 'MediaElement',
        media: audioRef.current,
        dragToSeek: true,
        plugins: [regionsPlugin]
      });

      // Set up event handlers
      wavesurfer.on('ready', () => {
        setIsLoaded(true);
      });

      wavesurfer.on('play', () => setIsPlaying(true));
      wavesurfer.on('pause', () => setIsPlaying(false));

      // Enable region selection with next color from manager
      regionsPlugin.enableDragSelection({
        color: colorManagerRef.current.getNextColor(),
      });

      // Setup event listeners
      setupEventListeners();

      // Store the instance
      wavesurferRef.current = wavesurfer;

      initializeCroppedWaveform();

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize WaveSurfer:', error);
    }
  }, [audioRef, height, progressColor, waveColor, isInitialized, getRegionsPlugin, setupEventListeners]);

  // Clean up on unmount
  const destroy = useCallback(() => {
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.destroy();
        regionsPluginRef.current?.destroy();
        croppedWaveSurferRef.current?.destroy();
      } catch (error) {
        console.error('Error destroying WaveSurfer:', error);
      }
      wavesurferRef.current = null;
      regionsPluginRef.current = null;
      croppedWaveSurferRef.current = null;

      if (selectedRegionRef.current !== null) {
        updateSelectedRegion(null);
      }

      setIsInitialized(false);
      setIsLoaded(false);
      setIsPlaying(false);
    }
  }, [updateSelectedRegion]);

  // Play/pause audio
  const playPause = useCallback(() => {
    // Initialize on first play if not already initialized
    if (!isInitialized) {
      initialize();
    }

    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  }, [initialize, isInitialized]);

  // Clear all regions
  const clearRegions = useCallback(() => {
    regionsPluginRef.current?.clearRegions();

    // Clear selection and notify
    if (selectedRegionRef.current !== null) {
      console.log("Clearing selection from clearRegions");
      updateSelectedRegion(null);
    }

    // Reset color manager
    colorManagerRef.current.reset();
  }, [updateSelectedRegion]);

  // Remove region
  const removeRegion = useCallback((region: Region) => {
    const currentSelection = selectedRegionRef.current;
    const isSelectedRegion = currentSelection && currentSelection.id === region.id;

    console.log("Removing region:", region.id, "isSelected:", isSelectedRegion);

    // Remove the region first
    region.remove();

    // Call the callback
    if (onRegionRemoved) {
      onRegionRemoved(region);
    }

    // Clear selection if needed and notify
    if (isSelectedRegion) {
      console.log("Clearing selection due to region removal");
      updateSelectedRegion(null);
    }
  }, [onRegionRemoved, updateSelectedRegion]);

  return {
    containerRef,
    croppedRef,
    isPlaying,
    isLoaded,
    isInitialized,
    selectedRegion,
    initialize,
    destroy,
    playPause,
    clearRegions,
    removeRegion,
    updateSelectedRegion,
    wavesurfer: wavesurferRef.current,
    regionsPlugin: regionsPluginRef.current,
    croppedWaveSurfer: croppedWaveSurferRef.current,
  };
} 
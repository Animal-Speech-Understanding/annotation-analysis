import { useState, useRef, useCallback, useEffect } from 'react';
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
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const croppedRef = useRef<HTMLDivElement>(null);
  const croppedWaveSurferRef = useRef<WaveSurfer | null>(null);
  const spectrogramPluginRef = useRef<Spectrogram | null>(null);

  const regionsPluginRef = useRef<ReturnType<typeof RegionsPlugin.create> | null>(null);
  const colorManagerRef = useRef<RegionColorManager>(new RegionColorManager());
  const selectedRegionRef = useRef<Region | null>(null);

  const updateSelectedRegion = useCallback((region: Region | null) => {
    setSelectedRegion(region ? { region, start: region.start, end: region.end } : { region: null });
    selectedRegionRef.current = region;
    console.log('updateSelectedRegion', region);

    if (onRegionSelected) {
      onRegionSelected(region);
    }

    if (region && croppedWaveSurferRef.current && croppedRef.current && croppedWaveSurferRef.current.getDuration() > 0) {
      console.log('SUCCESS: region, croppedWaveSurferRef.current, croppedRef.current, croppedWaveSurferRef.current.getDuration() > 0');
      const { start, end } = region;
      const duration = end - start;

      if (duration > 0) {
        console.log('SUCCESS: duration is greater than 0');
        const width = croppedRef.current.clientWidth;
        if (width > 0) {
          console.log('SUCCESS: width is greater than 0');
          const pxPerSec = width / duration;
          croppedWaveSurferRef.current.zoom(pxPerSec);
          croppedWaveSurferRef.current.setScrollTime(start);


        }
      } else {
        console.log('FAILED: duration is 0');
        croppedWaveSurferRef.current.zoom(1);
        croppedWaveSurferRef.current.setScrollTime(0);
      }
    } else if (!region && croppedWaveSurferRef.current) {
      console.log('FAILED: region is null');
      croppedWaveSurferRef.current.zoom(1);
      croppedWaveSurferRef.current.setScrollTime(0);
    }
    console.log('updateSelectedRegion complete');
  }, [onRegionSelected]);

  const getRegionsPlugin = useCallback(() => {
    if (!regionsPluginRef.current) {
      regionsPluginRef.current = RegionsPlugin.create();
    }
    return regionsPluginRef.current;
  }, []);

  const setupEventListeners = useCallback(() => {
    const regionsPlugin = regionsPluginRef.current;
    if (!regionsPlugin) return;

    const handlers = createRegionHandlers({
      onRegionCreated,
      onRegionRemoved,
      selectedRegionRef,
      colorManagerRef,
      updateSelectedRegion
    });

    regionsPlugin.on('region-created', handlers.handleRegionCreated);
    regionsPlugin.on('region-updated', handlers.handleRegionUpdated);
    regionsPlugin.on('region-clicked', handlers.handleRegionClicked);

    return () => {
      regionsPlugin.un('region-created', handlers.handleRegionCreated);
      regionsPlugin.un('region-updated', handlers.handleRegionUpdated);
      regionsPlugin.un('region-clicked', handlers.handleRegionClicked);
    };
  }, [onRegionCreated, onRegionRemoved, updateSelectedRegion, getRegionsPlugin]);

  useEffect(() => {
    if (!isInitialized || !croppedRef.current || !audioRef?.current || croppedWaveSurferRef.current) {
      return;
    }

    const wsCropped = WaveSurfer.create({
      container: croppedRef.current,
      waveColor: '#ddd',
      progressColor: '#555',
      backend: 'MediaElement',
      media: audioRef.current,
      autoCenter: false,
      autoScroll: false,
      hideScrollbar: true,
    });
    croppedWaveSurferRef.current = wsCropped;


    wsCropped.registerPlugin(
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
      wsCropped.destroy();
      croppedWaveSurferRef.current = null;
      spectrogramPluginRef.current = null;
    };
  }, [isInitialized, croppedRef, audioRef]);

  const initialize = useCallback(() => {
    if (isInitialized || !containerRef.current || !audioRef?.current) return;

    try {
      const regions = getRegionsPlugin();

      const wsMain = WaveSurfer.create({
        container: containerRef.current,
        waveColor,
        progressColor,
        height,
        backend: 'MediaElement',
        media: audioRef.current,
        dragToSeek: true,
        plugins: [regions]
      });
      wavesurferRef.current = wsMain;

      wsMain.on('ready', () => {
        setIsLoaded(true);
      });
      wsMain.on('play', () => setIsPlaying(true));
      wsMain.on('pause', () => setIsPlaying(false));

      regions.enableDragSelection({
        color: colorManagerRef.current.getNextColor(),
      });

      setupEventListeners();

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize WaveSurfer:', error);
    }
  }, [audioRef, waveColor, progressColor, height, getRegionsPlugin, setupEventListeners]);

  const destroy = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }
    if (regionsPluginRef.current) {
      regionsPluginRef.current = null;
    }

    if (selectedRegionRef.current !== null) {
      updateSelectedRegion(null);
    }

    setIsInitialized(false);
    setIsLoaded(false);
    setIsPlaying(false);
  }, [updateSelectedRegion]);

  const playPause = useCallback(() => {
    if (!isInitialized && !wavesurferRef.current) {
      initialize();
    } else if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  }, [initialize, isInitialized]);

  const clearRegions = useCallback(() => {
    regionsPluginRef.current?.clearRegions();
    if (selectedRegionRef.current !== null) {
      updateSelectedRegion(null);
    }
    colorManagerRef.current.reset();
  }, [updateSelectedRegion]);

  const removeRegion = useCallback((region: Region) => {
    region.remove();
    if (onRegionRemoved) {
      onRegionRemoved(region);
    }
    if (selectedRegionRef.current?.id === region.id) {
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
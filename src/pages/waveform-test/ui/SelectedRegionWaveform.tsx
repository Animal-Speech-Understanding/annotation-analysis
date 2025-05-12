import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface DualWaveformProps {
  /** URL of the audio file to load */
  url: string;
}

/**
 * DualWaveform component:
 * - First waveform: user can drag to create a region.
 * - Second waveform: displays the cropped region segment.
 */
const DualWaveform: React.FC<DualWaveformProps> = ({ url }) => {
  const selectRef = useRef<HTMLDivElement | null>(null);
  const selectWS = useRef<WaveSurfer | null>(null);
  const croppedRef = useRef<HTMLDivElement | null>(null);
  const croppedWS = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    const selectContainer = selectRef.current;
    const croppedContainer = croppedRef.current;
    if (!selectContainer || !croppedContainer) return;

    // Instantiate Regions plugin for selection waveform
    const regionsPlugin = RegionsPlugin.create();

    // Create WaveSurfer for region selection
    selectWS.current = WaveSurfer.create({
      container: selectContainer,
      waveColor: '#ddd',
      progressColor: '#555',
      url,
      plugins: [regionsPlugin],
    });

    // Create WaveSurfer for displaying cropped region
    croppedWS.current = WaveSurfer.create({
      container: croppedContainer,
      waveColor: '#ddd',
      progressColor: '#555',
    });

    // Enable drag-to-create on the selection waveform
    regionsPlugin.enableDragSelection({ color: 'rgba(0, 255, 0, 0.1)' });

    // On region creation, extract and load that segment into the cropped waveform
    regionsPlugin.on('region-created', (region) => {
      const buffer = selectWS.current?.getDecodedData();
      if (!buffer) return;
      const sr = buffer.sampleRate;
      const startSample = Math.floor(region.start * sr);
      const endSample = Math.floor(region.end * sr);
      const segmentLength = endSample - startSample;

      // Slice each channel
      const channelData: Float32Array[] = [];
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        channelData.push(
          buffer.getChannelData(ch).slice(startSample, endSample)
        );
      }

      // Load cropped data into second waveform
      croppedWS.current?.load('', channelData, segmentLength / sr);
    });

    // Cleanup on unmount
    return () => {
      selectWS.current?.destroy();
      croppedWS.current?.destroy();
      selectWS.current = null;
      croppedWS.current = null;
    };
  }, [url]);

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <h3>Select a region:</h3>
        <div
          ref={selectRef}
          style={{ width: '100%', height: '128px' }}
        />
      </div>
      <div>
        <h3>Cropped region:</h3>
        <div
          ref={croppedRef}
          style={{ width: '100%', height: '128px' }}
        />
      </div>
    </div>
  );
};

export default DualWaveform;

import { useState, useRef } from 'react';
import WavesurferPlayer from '@wavesurfer/react';
import WaveSurfer from 'wavesurfer.js';
import { MarkerManager } from './MarkerManager';
import { MarkerControls } from './MarkerControls';
import { Selection, MarkerVisibility } from '../model/types';

interface WaveformDisplayProps {
  selections: Selection[];
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({ 
  selections,
  onPlayStateChange 
}) => {
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [markerVisibility, setMarkerVisibility] = useState<MarkerVisibility>({
    begin: true,
    middle: true,
    end: true
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const audioUrl = '/static/19840322a.wav';

  const onReady = (ws: WaveSurfer): void => {
    setWavesurfer(ws);
    setIsPlaying(false);
    setIsLoaded(true);
  };

  const onPlayPause = (): void => {
    if (wavesurfer) {
      wavesurfer.playPause();
    }
  };

  const handlePlayChange = (playing: boolean) => {
    setIsPlaying(playing);
    if (onPlayStateChange) {
      onPlayStateChange(playing);
    }
  };

  const handleVisibilityChange = (visibility: MarkerVisibility) => {
    setMarkerVisibility(visibility);
  };

  return (
    <div>
      <MarkerControls 
        visibility={markerVisibility} 
        onVisibilityChange={handleVisibilityChange} 
      />
      
      <div 
        ref={containerRef}
        style={{ 
          border: "1px solid #ccc", 
          borderRadius: "4px", 
          padding: "10px",
          marginBottom: "20px",
          position: "relative"
        }}
      >
        <WavesurferPlayer
          height={100}
          waveColor='violet'
          progressColor='purple'
          url={audioUrl}
          onReady={onReady}
          onPlay={() => handlePlayChange(true)}
          onPause={() => handlePlayChange(false)}
        />
        {!isLoaded && <div style={{ textAlign: "center", padding: "20px" }}>Loading waveform...</div>}
        
        {wavesurfer && (
          <MarkerManager 
            wavesurfer={wavesurfer}
            selections={selections}
            visibility={markerVisibility}
          />
        )}
      </div>

      <button 
        onClick={onPlayPause}
        style={{
          padding: "8px 16px",
          background: "purple",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
        disabled={!isLoaded}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}; 
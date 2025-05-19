import React, { useEffect, useRef, useState } from 'react';
import { useWaveform } from '../model/useWaveform';
import { MarkerManager } from '@entities/MarkerManager';
import { MarkerVisibility, Selection } from '@entities/MarkerManager/model';
import { MarkerControls } from '@entities/MarkerManager';

interface RegionWaveformProps {
  audioUrl: string;
  selections: Selection[];
}

export const RegionWaveform: React.FC<RegionWaveformProps> = ({
  audioUrl,
  selections,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    containerRef,
    croppedRef,
    isPlaying,
    isLoaded,
    isInitialized,
    initialize,
    playPause,
    clearRegions,
    selectedRegion,
    removeRegion,
    wavesurfer,
    croppedWaveSurfer,
    destroy
  } = useWaveform({
    audioRef: audioRef as React.RefObject<HTMLAudioElement>,
  });

  const [markerVisibility, setMarkerVisibility] = useState<MarkerVisibility>({
    begin: true,
    middle: true,
    end: true
  });

  const handleVisibilityChange = (visibility: MarkerVisibility) => {
    setMarkerVisibility(visibility);
  };

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  return (
    <div>
      <MarkerControls
        visibility={markerVisibility}
        onVisibilityChange={handleVisibilityChange}
      />
      <audio
        src={audioUrl}
        ref={audioRef}
        style={{ display: 'none' }}
      />

      {!isLoaded && (
        <div style={{ textAlign: "center", padding: "10px", color: "#666" }}>
          Loading waveform...
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          minHeight: "100px",
          position: "relative",
        }}
      >

        {wavesurfer && (
          <MarkerManager
            wavesurfer={wavesurfer}
            selections={selections}
            visibility={markerVisibility}
          />
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", marginTop: "20px" }}>
        <button
          onClick={playPause}
          style={{
            padding: "8px 16px",
            background: "purple",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            opacity: isInitialized ? 1 : 0.5
          }}
          disabled={!isInitialized}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={clearRegions}
          style={{
            padding: "8px 16px",
            background: "#666",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            opacity: isInitialized ? 1 : 0.5
          }}
          disabled={!isInitialized}
        >
          Clear Regions
        </button>

        {selectedRegion.region && (
          <button
            onClick={() => removeRegion(selectedRegion.region!)}
            style={{
              padding: "8px 16px",
              background: "red",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              opacity: isInitialized ? 1 : 0.5
            }}
            disabled={!isInitialized}
          >
            Remove Region
          </button>
        )}
      </div>


      <div style={{
        marginTop: "20px",
        padding: "15px",
        backgroundColor: "#f8f0f8",
        borderRadius: "4px",
        border: "1px solid #e0c0e0",
        visibility: selectedRegion.region ? 'visible' : 'hidden'
      }}>
        <h3 style={{ marginTop: 0 }}>Selected Region Details
        </h3>
        <div>
          Color:
          <div style={{
            width: "30px",
            height: "30px",
            backgroundColor: selectedRegion.region?.color,
            border: "1px solid #ccc",
            borderRadius: "4px",
            display: "inline-block",
            marginLeft: "10px"
          }}></div>
        </div>
        {selectedRegion.region && (
          <>
            <p>Start time: {selectedRegion.region.start.toFixed(3)} seconds</p>
            <p>End time: {selectedRegion.region.end.toFixed(3)} seconds</p>
            <p>Duration: {(selectedRegion.region.end - selectedRegion.region.start).toFixed(3)} seconds</p>
          </>
        )}
        <div
          ref={croppedRef}
          style={{
            marginTop: "15px",
            marginBottom: "20px",
            minHeight: "100px",
            position: "relative",
          }}
        >
          {croppedWaveSurfer && selectedRegion.region && (
            <MarkerManager
              wavesurfer={croppedWaveSurfer}
              selections={selections}
              visibility={markerVisibility}
              beginTime={selectedRegion.region.start}
              endTime={selectedRegion.region.end}
            />
          )}
        </div>
      </div>


    </div>
  );
};

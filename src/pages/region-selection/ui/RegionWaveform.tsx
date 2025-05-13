import React, { useRef } from 'react';
import { useWaveform } from '../model/useWaveform';

interface RegionWaveformProps {
  audioUrl: string;
}

export const RegionWaveform: React.FC<RegionWaveformProps> = ({
  audioUrl,
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
  } = useWaveform({
    audioRef: audioRef as React.RefObject<HTMLAudioElement>,
    onRegionCreated: (region) => {
      console.log('region-created', region);
    },
  });

  return (
    <div>
      <audio
        src={audioUrl}
        ref={audioRef}
        style={{ display: 'none' }}
      />
      <div
        ref={containerRef}
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "10px",
          marginBottom: "20px",
          minHeight: "100px"
        }}
      />

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {!isInitialized && (
          <button
            onClick={initialize}
            style={{
              padding: "8px 16px",
              background: "blue",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Initialize Waveform
          </button>
        )}

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
            onClick={() => {
              if (selectedRegion.region) {
                removeRegion(selectedRegion.region);
              }
            }}
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

      {!isInitialized && (
        <div style={{ textAlign: "center", padding: "10px", color: "#666" }}>
          Click "Initialize Waveform" to load audio visualization
        </div>
      )}

      {isInitialized && !isLoaded && (
        <div style={{ textAlign: "center", padding: "10px", color: "#666" }}>
          Loading waveform...
        </div>
      )}

      <div style={{
        marginTop: "20px",
        padding: "15px",
        backgroundColor: "#f8f0f8",
        borderRadius: "4px",
        border: "1px solid #e0c0e0",
        display: selectedRegion.region ? 'block' : 'none'
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
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "10px",
            marginBottom: "20px",
            minHeight: "100px"
          }}
        />
      </div>


    </div>
  );
};

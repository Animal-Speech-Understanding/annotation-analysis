import React, { useEffect } from 'react';
import { useWaveform } from '../model/useWaveform';

interface RegionWaveformProps {
  audioUrl: string;
}

export const RegionWaveform: React.FC<RegionWaveformProps> = ({ audioUrl }) => {
  const {
    containerRef,
    croppedRef,
    isPlaying,
    // isCroppedPlaying,
    isLoaded,
    initialize,
    playPause,
    // playPauseCropped,
    clearRegions,
    selectedRegion,
    removeRegion,
  } = useWaveform({
    audioUrl,
    onRegionCreated: (region) => {
      console.log('region-created', region);
    },
  });

  // Auto‐initialize (create + load) on first render
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div>
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
        {/* Play / Pause primary waveform */}
        <button
          onClick={playPause}
          disabled={!isLoaded}
          style={{
            padding: "8px 16px",
            background: "purple",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoaded ? "pointer" : "not-allowed",
            opacity: isLoaded ? 1 : 0.5
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        {/* Clear all regions */}
        <button
          onClick={clearRegions}
          disabled={!isLoaded}
          style={{
            padding: "8px 16px",
            background: "#666",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoaded ? "pointer" : "not-allowed",
            opacity: isLoaded ? 1 : 0.5
          }}
        >
          Clear Regions
        </button>

        {/* Remove the currently selected region */}
        {selectedRegion.region && (
          <button
            onClick={() => removeRegion(selectedRegion.region!)}
            disabled={!isLoaded}
            style={{
              padding: "8px 16px",
              background: "red",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isLoaded ? "pointer" : "not-allowed",
              opacity: isLoaded ? 1 : 0.5
            }}
          >
            Remove Region
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {!isLoaded && (
        <div style={{ textAlign: "center", padding: "10px", color: "#666" }}>
          Loading waveform...
        </div>
      )}

      {/* Once a region exists, show details & the cropped waveform */}
      {selectedRegion.region && (
        <div style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "#f8f0f8",
          borderRadius: "4px",
          border: "1px solid #e0c0e0"
        }}>
          <h3 style={{ marginTop: 0 }}>Selected Region Details</h3>
          <div>
            Color:
            <div style={{
              width: "30px",
              height: "30px",
              backgroundColor: selectedRegion.region!.color,
              border: "1px solid #ccc",
              borderRadius: "4px",
              display: "inline-block",
              marginLeft: "10px"
            }} />
          </div>
          <p>Start: {selectedRegion.region!.start.toFixed(3)}s</p>
          <p>End: {selectedRegion.region!.end.toFixed(3)}s</p>
          <p>Duration: {(selectedRegion.region!.end - selectedRegion.region!.start).toFixed(3)}s</p>

          {/* <div style={{ margin: "15px 0" }}>
            <button
              onClick={playPauseCropped}
              disabled={!isLoaded}
              style={{
                padding: "8px 16px",
                background: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isLoaded ? "pointer" : "not-allowed",
                opacity: isLoaded ? 1 : 0.5
              }}
            >
              {isCroppedPlaying ? 'Pause Region' : 'Play Region'}
            </button>
          </div> */}

          <div
            ref={croppedRef}
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "10px",
              minHeight: "100px"
            }}
          />
        </div>
      )}
    </div>
  );
};

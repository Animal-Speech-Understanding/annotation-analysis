import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useWaveSurfer } from '@/shared/stores/wavesurfer';
import { MarkerManager, SelectionGroupControls } from '@entities/MarkerManager';
import { SelectionGroup, SelectionVisibility } from '@entities/MarkerManager/model';

interface RegionWaveformProps {
  audioUrl: string;
  selectionGroups: SelectionGroup[];
  audioId: string;
}

export const RegionWaveform: React.FC<RegionWaveformProps> = ({
  audioUrl,
  selectionGroups,
  audioId,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const croppedRef = useRef<HTMLDivElement>(null);

  const {
    isPlaying,
    isLoaded,
    isInitialized,
    playPause,
    clearRegions,
    selectedRegion,
    removeRegion,
    mainWaveSurfer: wavesurfer,
    croppedWaveSurfer,
    setupMain,
    setupCropped,
  } = useWaveSurfer();

  // Initialize visibility state for all selection groups to true
  const initialVisibility = useMemo(() => {
    const visibility: SelectionVisibility = {};
    selectionGroups.forEach(group => {
      visibility[group.id] = true;
    });
    return visibility;
  }, [selectionGroups]);

  const [groupVisibility, setGroupVisibility] = useState<SelectionVisibility>(initialVisibility);

  const handleVisibilityChange = (visibility: SelectionVisibility) => {
    setGroupVisibility(visibility);
  };

  useEffect(() => {
    if (!isInitialized && containerRef.current && audioRef.current) {
      setupMain(containerRef.current, audioRef.current);
    }
  }, [isInitialized, setupMain]);

  useEffect(() => {
    if (isInitialized && croppedRef.current) {
      setupCropped(croppedRef.current);
    }
  }, [isInitialized, setupCropped]);

  // Update visibility if selection groups change
  useEffect(() => {
    setGroupVisibility(initialVisibility);
  }, [initialVisibility]);

  // Calculate statistics about the clicks for the current audio file
  const stats = useMemo(() => {
    if (!selectionGroups.length) return null;

    // Filter clicks for the current audio file
    const filterClicksForCurrentAudio = (group: SelectionGroup) => {
      return group.selections.filter(selection => {
        // First try to use the dedicated audioId field
        if (selection.audioId) {
          return selection.audioId.toLowerCase() === audioId.toLowerCase();
        }

        // Fallback to checking the name field (filename)
        if (selection.name) {
          return selection.name.toLowerCase().includes(audioId.toLowerCase());
        }

        return false;
      }).length;
    };

    // Get counts from each algorithm for this audio
    const algorithmCounts = selectionGroups.map(group => ({
      name: group.name,
      count: filterClicksForCurrentAudio(group)
    }));

    // Calculate average and total
    const totalClicks = algorithmCounts.reduce((sum, item) => sum + item.count, 0);
    const averageClicks = algorithmCounts.length > 0 ? totalClicks / algorithmCounts.length : 0;

    return {
      totalClicks,
      averageClicks: Math.round(averageClicks * 10) / 10,
      algorithmCounts
    };
  }, [selectionGroups, audioId]);

  return (
    <div>
      {selectionGroups.length > 0 && (
        <>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <strong>Detection Summary:</strong> {stats?.totalClicks} total clicks in this recording
              {stats?.algorithmCounts && stats.algorithmCounts.length > 1 ? ` (avg. ${stats?.averageClicks} per algorithm)` : ''}
            </div>
          </div>

          <SelectionGroupControls
            selectionGroups={selectionGroups}
            visibility={groupVisibility}
            onVisibilityChange={handleVisibilityChange}
            currentAudioId={audioId}
          />
        </>
      )}

      <div style={{
        borderRadius: '4px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <audio
          src={audioUrl}
          ref={audioRef}
          style={{ display: 'none' }}
        />

        {!isLoaded && (
          <div style={{ textAlign: "center", padding: "30px", color: "#666" }}>
            Loading waveform...
          </div>
        )}
        <div
          ref={containerRef}
          style={{
            minHeight: "120px",
            position: "relative",
            backgroundColor: "#f9f9f9",
            padding: "10px 0"
          }}
        >
          {wavesurfer && (
            <MarkerManager
              wavesurfer={wavesurfer}
              selectionGroups={selectionGroups}
              visibility={groupVisibility}
              currentAudioId={audioId}
            />
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", marginTop: "20px" }}>
        <button
          onClick={playPause}
          style={{
            padding: "8px 16px",
            background: isPlaying ? "#555" : "purple",
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
              selectionGroups={selectionGroups}
              visibility={groupVisibility}
              beginTime={selectedRegion.region.start}
              endTime={selectedRegion.region.end}
              currentAudioId={audioId}
            />
          )}
        </div>
      </div>


    </div>
  );
};

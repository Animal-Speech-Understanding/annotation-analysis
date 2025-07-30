import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useWaveSurfer } from '@/shared/stores/wavesurfer';
import { MarkerManager, SelectionGroupControls, RealtimePredictionManager } from '@entities/MarkerManager';
import { SelectionGroup, SelectionVisibility, Selection } from '@entities/MarkerManager/model';

interface RegionWaveformProps {
  audioUrl: string;
  selectionGroups: SelectionGroup[];
  audioId: string;
  onPredictionUpdate?: (selections: Selection[]) => void;
}

export const RegionWaveform: React.FC<RegionWaveformProps> = ({
  audioUrl,
  selectionGroups,
  audioId,
  onPredictionUpdate,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const croppedRef = useRef<HTMLDivElement>(null);

  const {
    isPlaying,
    isLoaded,
    isInitialized,
    error,
    playPause,
    clearRegions,
    selectedRegion,
    removeRegion,
    playExtractedRegion,
    pauseExtractedRegion,
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

          {/* Real-time Prediction Manager */}
          {onPredictionUpdate && (
            <div style={{ marginTop: '15px' }}>
              <RealtimePredictionManager
                audioElement={audioRef.current}
                audioId={audioId}
                onSelectionsUpdate={onPredictionUpdate}
              />
            </div>
          )}
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
      </div>


      <div style={{
        marginTop: "20px",
        padding: "15px",
        backgroundColor: "#f8f0f8",
        borderRadius: "4px",
        border: "1px solid #e0c0e0",
        visibility: selectedRegion.region ? 'visible' : 'hidden'
      }}>
        <h3 style={{ marginTop: 0 }}>Selected Region Details</h3>

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

            {/* Region action buttons */}
            <div style={{
              display: "flex",
              gap: "10px",
              marginTop: "15px",
              marginBottom: "15px"
            }}>
              {selectedRegion.extractedAudioUrl && (
                <>
                  {!selectedRegion.isPlayingRegion ? (
                    <button
                      onClick={playExtractedRegion}
                      style={{
                        padding: "8px 16px",
                        background: "#4caf50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                      title="Play this extracted audio region"
                    >
                      ▶️ Play Region
                    </button>
                  ) : (
                    <button
                      onClick={pauseExtractedRegion}
                      style={{
                        padding: "8px 16px",
                        background: "#ff5722",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                      title="Pause region playback"
                    >
                      ⏸️ Pause Region
                    </button>
                  )}
                </>
              )}

              {selectedRegion.isExtracting && (
                <div style={{
                  padding: "8px 16px",
                  background: "#e3f2fd",
                  color: "#1976d2",
                  border: "1px solid #bbdefb",
                  borderRadius: "4px",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}>
                  🔄 Preparing audio...
                </div>
              )}

              <button
                onClick={() => removeRegion(selectedRegion.region!)}
                style={{
                  padding: "8px 16px",
                  background: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
                title="Remove this region"
              >
                🗑️ Remove Region
              </button>
            </div>
          </>
        )}

        {/* Audio extraction status */}
        {selectedRegion.isExtracting && (
          <div style={{
            padding: "10px",
            backgroundColor: "#e3f2fd",
            borderRadius: "4px",
            margin: "10px 0",
            color: "#1976d2"
          }}>
            🔄 Extracting audio region...
          </div>
        )}

        {selectedRegion.extractionError && (
          <div style={{
            padding: "10px",
            backgroundColor: "#ffebee",
            borderRadius: "4px",
            margin: "10px 0",
            color: "#d32f2f"
          }}>
            ❌ Extraction failed: {selectedRegion.extractionError}
          </div>
        )}

        {/* Show general error messages (like minimum duration notifications) */}
        {error && (
          <div style={{
            padding: "10px",
            backgroundColor: error.includes('minimum duration') ? "#e3f2fd" : "#ffebee",
            borderRadius: "4px",
            margin: "10px 0",
            color: error.includes('minimum duration') ? "#1976d2" : "#d32f2f"
          }}>
            {error.includes('minimum duration') ? '📏' : '⚠️'} {error}
          </div>
        )}

        {selectedRegion.extractedAudioUrl && !selectedRegion.isExtracting && (
          <div style={{
            padding: "10px",
            backgroundColor: "#e8f5e8",
            borderRadius: "4px",
            margin: "10px 0",
            color: "#2e7d32",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>✅ Audio extracted successfully</span>
          </div>
        )}
        <div
          ref={croppedRef}
          style={{
            marginTop: "15px",
            marginBottom: "20px",
            minHeight: "100px",
            position: "relative",
            border: selectedRegion.isPlayingRegion
              ? "2px solid #4caf50"
              : "2px solid transparent",
            borderRadius: "4px",
            transition: "border-color 0.3s ease",
            backgroundColor: selectedRegion.isPlayingRegion
              ? "rgba(76, 175, 80, 0.05)"
              : "transparent",
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

          {!selectedRegion.extractedAudioUrl && !selectedRegion.isExtracting && selectedRegion.region && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#666",
              fontSize: "14px",
              textAlign: "center"
            }}>
              🔄 Processing region audio...
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

import React, { useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { SelectionGroup, SelectionVisibility } from './model/types';

interface MarkerManagerProps {
  wavesurfer: WaveSurfer | null;
  selectionGroups: SelectionGroup[];
  visibility: SelectionVisibility;
  beginTime?: number;
  endTime?: number;
  currentAudioId?: string;
}

interface MarkerProps {
  time: number;
  duration: number;
  color: string;
  title: string;
}

const Marker: React.FC<MarkerProps> = ({
  time,
  duration,
  color,
  title
}) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    height: '100%',
    width: '2px',
    backgroundColor: color,
    left: `${(time / duration) * 100}%`,
    top: 0,
    zIndex: 100,
    cursor: 'pointer',
    boxShadow: '0 0 2px rgba(0, 0, 0, 0.5)',
  };

  return <div style={style} title={title} />;
};

/**
 * Manages the creation and positioning of markers on the waveform
 */
export const MarkerManager: React.FC<MarkerManagerProps> = ({
  wavesurfer,
  selectionGroups,
  visibility,
  beginTime: beginTimeProp,
  endTime: endTimeProp,
  currentAudioId
}) => {
  if (!wavesurfer) return null;

  const totalWaveformDuration = wavesurfer.getDuration();
  if (!totalWaveformDuration) return null;

  const beginTime = beginTimeProp !== undefined ? beginTimeProp : 0;
  const endTime = endTimeProp !== undefined ? endTimeProp : totalWaveformDuration;

  const markers = useMemo(() => {
    const visibleDuration = endTime - beginTime;

    if (visibleDuration <= 1e-6) {
      return [];
    }

    const allMarkers: React.ReactElement[] = [];

    // Process each selection group
    selectionGroups.forEach(group => {
      // Skip if this group is not visible
      if (visibility[group.id] === false) {
        return;
      }

      // Process each selection in the group, filtering by current audio if specified
      const relevantSelections = currentAudioId
        ? group.selections.filter(selection => {
          // Check audioId field first (exact match)
          if (selection.audioId) {
            return selection.audioId.toLowerCase() === currentAudioId.toLowerCase();
          }

          // Fallback to filename check
          if (selection.name) {
            return selection.name.toLowerCase().includes(currentAudioId.toLowerCase());
          }

          return false;
        })
        : group.selections;

      // Only show begin times for relevant selections
      relevantSelections.forEach(selection => {
        const actualTime = selection.beginTime;

        if (actualTime >= beginTime && actualTime <= endTime) {
          const relativeTime = actualTime - beginTime;

          allMarkers.push(
            <Marker
              key={`begin-${group.id}-${selection.id}`}
              time={relativeTime}
              duration={visibleDuration}
              color={group.color}
              title={`${group.name} ${selection.id}`}
            />
          );
        }
      });
    });

    return allMarkers;
  }, [selectionGroups, visibility, beginTime, endTime, currentAudioId]);

  return (
    <div style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 10
    }}>
      {markers}
    </div>
  );
}; 
import React, { useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Selection, MarkerVisibility } from '../model/types';

interface MarkerManagerProps {
  wavesurfer: WaveSurfer | null;
  selections: Selection[];
  visibility: MarkerVisibility;
  beginTime?: number;
  endTime?: number;
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
  selections,
  visibility,
  beginTime: beginTimeProp,
  endTime: endTimeProp
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

    selections.forEach(selection => {
      const addMarkerIfVisible = (
        key: string,
        actualTime: number,
        color: string,
        title: string
      ) => {
        if (actualTime >= beginTime && actualTime <= endTime) {
          const relativeTime = actualTime - beginTime;

          allMarkers.push(
            <Marker
              key={key}
              time={relativeTime}
              duration={visibleDuration}
              color={color}
              title={title}
            />
          );
        }
      };

      if (visibility.begin) {
        addMarkerIfVisible(
          `begin-${selection.id}`,
          selection.beginTime,
          "#00bb0033",
          `Begin ${selection.id}`
        );
      }

      if (visibility.middle) {
        const middleTime = (selection.beginTime + selection.endTime) / 2;
        addMarkerIfVisible(
          `middle-${selection.id}`,
          middleTime,
          "#0088ff33",
          `Middle ${selection.id}`
        );
      }

      if (visibility.end) {
        addMarkerIfVisible(
          `end-${selection.id}`,
          selection.endTime,
          "#ff000033",
          `End ${selection.id}`
        );
      }
    });

    return allMarkers;
  }, [selections, visibility, beginTime, endTime]);

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
import React, { useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Selection, MarkerVisibility } from '../model/types';

interface MarkerManagerProps {
  wavesurfer: WaveSurfer | null;
  selections: Selection[];
  visibility: MarkerVisibility;
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
  visibility
}) => {
  if (!wavesurfer) return null;
  
  const duration = wavesurfer.getDuration();
  if (!duration) return null;
  
  const markers = useMemo(() => {
    const allMarkers: React.ReactElement[] = [];
    
    selections.forEach(selection => {
      if (visibility.begin) {
        allMarkers.push(
          <Marker
            key={`begin-${selection.id}`}
            time={selection.beginTime}
            duration={duration}
            color="#00bb00"
            title={`Begin ${selection.id}`}
          />
        );
      }
      
      if (visibility.middle) {
        const middleTime = (selection.beginTime + selection.endTime) / 2;
        allMarkers.push(
          <Marker
            key={`middle-${selection.id}`}
            time={middleTime}
            duration={duration}
            color="#0088ff"
            title={`Middle ${selection.id}`}
          />
        );
      }
      
      if (visibility.end) {
        allMarkers.push(
          <Marker
            key={`end-${selection.id}`}
            time={selection.endTime}
            duration={duration}
            color="#ff0000"
            title={`End ${selection.id}`}
          />
        );
      }
    });
    
    return allMarkers;
  }, [selections, duration, visibility]);

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
import React from 'react';
import { MarkerVisibility } from './model/types';

interface MarkerControlsProps {
  visibility: MarkerVisibility;
  onVisibilityChange: (visibility: MarkerVisibility) => void;
}

/**
 * Component for controlling which types of markers are displayed
 */
export const MarkerControls: React.FC<MarkerControlsProps> = ({
  visibility,
  onVisibilityChange
}) => {
  const handleCheckboxChange = (markerType: keyof MarkerVisibility) => {
    onVisibilityChange({
      ...visibility,
      [markerType]: !visibility[markerType]
    });
  };

  return (
    <div style={{
      margin: '10px 0',
      display: 'flex',
      gap: '10px'
    }}>
      <label style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={visibility.begin}
          onChange={() => handleCheckboxChange('begin')}
          style={{ marginRight: '5px' }}
        />
        <div style={{ width: '12px', height: '12px', backgroundColor: '#00bb00', marginRight: '5px' }}></div>
        Begin
      </label>

      <label style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={visibility.middle}
          onChange={() => handleCheckboxChange('middle')}
          style={{ marginRight: '5px' }}
        />
        <div style={{ width: '12px', height: '12px', backgroundColor: '#0088ff', marginRight: '5px' }}></div>
        Middle
      </label>

      <label style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={visibility.end}
          onChange={() => handleCheckboxChange('end')}
          style={{ marginRight: '5px' }}
        />
        <div style={{ width: '12px', height: '12px', backgroundColor: '#ff0000', marginRight: '5px' }}></div>
        End
      </label>
    </div>
  );
}; 
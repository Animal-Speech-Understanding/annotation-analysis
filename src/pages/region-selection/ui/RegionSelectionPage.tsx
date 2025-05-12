import React from 'react';
import { RegionWaveform } from './RegionWaveform';

/**
 * Page component for selecting regions in an audio waveform
 */
export const RegionSelectionPage: React.FC = () => {
  const audioUrl = '/static/19840322a.wav';

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px" }}>Audio Region Selection</h1>

      <RegionWaveform
        audioUrl={audioUrl}
      />

    </div>
  );
}; 
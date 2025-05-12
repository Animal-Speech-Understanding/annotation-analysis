import React, { useState } from 'react';
import Waveform from './SelectedRegionWaveform';

/**
 * Test page for the Waveform component with region selection capability
 */
export const WaveformTestPage: React.FC = () => {
  // Example audio URL - replace with an actual audio file URL from your project
  const [audioUrl, setAudioUrl] = useState<string>('/static/19840322a.wav');

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px" }}>Waveform Test Page</h1>

      <div style={{ marginBottom: "20px", lineHeight: "1.5" }}>
        <p><strong>Instructions:</strong></p>
        <ul style={{ marginLeft: "20px", marginTop: "10px" }}>
          <li>Click and drag on the waveform to create a selection</li>
          <li>The waveform will automatically crop to the selected region</li>
          <li>Reload the page to start over with the original audio file</li>
        </ul>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Audio Waveform with Region Selection</h3>
        <Waveform url={audioUrl} />
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Try a different audio file</h3>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            onClick={() => setAudioUrl('/static/19840322a.wav')}
            style={{
              padding: "8px 16px",
              backgroundColor: audioUrl === '/static/19840322a.wav' ? "#007bff" : "#e0e0e0",
              color: audioUrl === '/static/19840322a.wav' ? "white" : "black",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Sample Audio 1
          </button>
          <button
            onClick={() => setAudioUrl('/static/sample2.wav')}
            style={{
              padding: "8px 16px",
              backgroundColor: audioUrl === '/static/sample2.wav' ? "#007bff" : "#e0e0e0",
              color: audioUrl === '/static/sample2.wav' ? "white" : "black",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Sample Audio 2
          </button>
        </div>
      </div>
    </div>
  );
}; 
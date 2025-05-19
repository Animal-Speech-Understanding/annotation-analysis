import React, { useEffect, useState } from 'react';
import { RegionWaveform } from './RegionWaveform';
import { fetchSelections } from '@entities/MarkerManager';
import { Selection } from '@/entities/MarkerManager/model';

/**
 * Page component for selecting regions in an audio waveform
 */
export const RegionSelectionPage: React.FC = () => {
  const audioUrl = '/static/19840322a.wav';

  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSelections = async () => {
      try {
        setLoading(true);
        const data = await fetchSelections();
        setSelections(data);
      } catch (error) {
        console.error('Error loading selections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSelections();
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px" }}>Audio Region Selection</h1>

      {loading ? (
        <div>Loading selection data...</div>
      ) : (
        <RegionWaveform
          audioUrl={audioUrl}
          selections={selections}
        />
      )}
    </div>
  );
}; 
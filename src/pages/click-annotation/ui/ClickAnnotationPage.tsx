import React, { useState, useEffect } from 'react';
import { Selection } from '../model/types';
import { fetchSelections } from '../api/selectionsApi';
import { WaveformDisplay } from './WaveformDisplay';
import { Legend } from './Legend';

/**
 * Main page component for the click annotation feature
 */
export const ClickAnnotationPage: React.FC = () => {
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
    <div style={{ padding: "20px" }}>
      <h1>Sperm Whale Audio Visualization</h1>
      
      {loading ? (
        <div>Loading selection data...</div>
      ) : (
        <>
          <WaveformDisplay selections={selections} />
          <Legend selectionCount={selections.length} />
        </>
      )}
    </div>
  );
};

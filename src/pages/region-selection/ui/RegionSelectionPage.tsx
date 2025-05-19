import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RegionWaveform } from './RegionWaveform';
import { fetchMultipleSelections } from '@entities/MarkerManager';
import { SelectionGroup } from '@/entities/MarkerManager/model/types';
import { audioFiles, AudioFile, getSelectionFilesFromAlgorithms } from '@/shared/config/audioFiles';

/**
 * Page component for selecting regions in an audio waveform
 */
export const RegionSelectionPage: React.FC = () => {
  const { audioId } = useParams<{ audioId: string }>();
  const [selectionGroups, setSelectionGroups] = useState<SelectionGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [audioFile, setAudioFile] = useState<AudioFile | undefined>();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Find the selected audio file
        const selectedAudio = audioFiles.find(audio => audio.id === audioId);
        setAudioFile(selectedAudio);

        if (!selectedAudio) {
          console.error('Audio file not found');
          return;
        }

        // Fetch selection data from all available algorithms
        // Since selections are now algorithm-based instead of audio-specific,
        // we load all algorithm selections
        const selectionFiles = getSelectionFilesFromAlgorithms();
        const groups = await fetchMultipleSelections(selectionFiles);

        // Filter selections to only show those relevant to the current audio file
        // This filtering might happen in the UI or by filename in the data
        setSelectionGroups(groups);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [audioId]);

  if (!audioFile && !loading) {
    return (
      <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
        <h1>Audio not found</h1>
        <p>The requested audio file could not be found.</p>
        <Link to="/" style={{ color: '#3498db' }}>
          Return to audio selection
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Link to="/" style={{
          color: '#3498db',
          marginRight: '20px',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ marginRight: '5px' }}>←</span> Back
        </Link>
        <h1 style={{ margin: 0 }}>
          {audioFile?.title || 'Audio Region Selection'}
        </h1>
      </div>

      {audioFile?.description && (
        <p style={{ marginBottom: '20px', color: '#666' }}>
          {audioFile.description}
        </p>
      )}

      {/* Algorithm Explanation */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}>Detection Algorithms:</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          Each algorithm analyzes audio files and detects potential sperm whale clicks.
          Toggle the checkboxes below to compare how different algorithms perform.
        </p>
      </div>

      {loading ? (
        <div>Loading selection data...</div>
      ) : (
        <RegionWaveform
          audioUrl={audioFile?.url || ''}
          selectionGroups={selectionGroups}
          audioId={audioId || ''}
        />
      )}
    </div>
  );
}; 
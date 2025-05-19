import React from 'react';
import { Link } from 'react-router-dom';
import { audioFiles } from '@/shared/config/audioFiles';

/**
 * AudioCard component for displaying individual audio files
 */
const AudioCard: React.FC<{
  id: string;
  title: string;
  description: string;
}> = ({ id, title, description }) => {
  return (
    <Link
      to={`/region-selection/${id}`}
      style={{
        textDecoration: 'none',
        color: 'inherit'
      }}
    >
      <div style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        backgroundColor: '#f9f9f9',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        }}
      >
        <h3 style={{
          marginTop: 0,
          marginBottom: '8px',
          color: '#2c3e50',
          fontSize: '18px'
        }}>
          {title}
        </h3>
        <p style={{
          margin: 0,
          color: '#7f8c8d',
          fontSize: '14px'
        }}>
          {description}
        </p>
        <div style={{
          marginTop: '12px',
          fontSize: '12px',
          color: '#3498db'
        }}>
          Click to analyze
        </div>
      </div>
    </Link>
  );
};

/**
 * HomePage component displaying a list of available audio recordings
 */
export const HomePage: React.FC = () => {
  return (
    <div style={{
      padding: "20px",
      maxWidth: "800px",
      margin: "0 auto"
    }}>
      <h1 style={{
        marginBottom: "20px",
        color: '#2c3e50'
      }}>
        Sperm Whale Audio Analysis
      </h1>

      <p style={{
        marginBottom: '24px',
        color: '#34495e',
        lineHeight: '1.5'
      }}>
        Select an audio recording below to begin analysis and region selection.
      </p>

      <div>
        {audioFiles.map(audio => (
          <AudioCard
            key={audio.id}
            id={audio.id}
            title={audio.title}
            description={audio.description}
          />
        ))}
      </div>
    </div>
  );
}; 
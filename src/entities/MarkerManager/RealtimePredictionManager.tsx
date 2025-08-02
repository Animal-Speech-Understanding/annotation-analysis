/**
 * Real-time Prediction Manager Component
 * 
 * This component handles the orchestration of real-time audio processing,
 * chunking, prediction requests, and marker updates.
 */

import React, { useState, useCallback, useRef } from 'react';
import { Selection } from './model/types';
import { chunkAudio, ChunkingConfig } from '@/shared/stores/wavesurfer/audioChunking';
import {
  processChunksInRealtime,
  ProcessingStatus,
  PredictionConfig
} from './api/predictionApi';

/**
 * Props for the RealtimePredictionManager
 */
interface RealtimePredictionManagerProps {
  /** Audio element to process */
  audioElement: HTMLAudioElement | null;
  /** Current audio file ID */
  audioId: string;
  /** Callback when new selections are received */
  onSelectionsUpdate: (selections: Selection[]) => void;
  /** Callback when processing status changes */
  onStatusUpdate?: (status: ProcessingStatus) => void;
  /** Backend API configuration */
  apiConfig?: PredictionConfig;
}

/**
 * Processing state for the manager
 */
interface ProcessingState {
  isProcessing: boolean;
  status: ProcessingStatus | null;
  error: string | null;
  canCancel: boolean;
}

/**
 * Default API configuration
 */
const DEFAULT_API_CONFIG: PredictionConfig = {
  apiUrl: 'http://localhost:8000/infer', // Default backend endpoint
  timeout: 15000 // 15 second timeout per chunk
};

/**
 * Default chunking configuration (5 second chunks with 3 second padding)
 */
const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  chunkDuration: 5.0, // 5 second chunks
  overlapDuration: 0.0, // No overlap for now
  paddingDuration: 3.0 // 3 second padding on each side for inference
};

/**
 * RealtimePredictionManager component
 */
export const RealtimePredictionManager: React.FC<RealtimePredictionManagerProps> = ({
  audioElement,
  audioId,
  onSelectionsUpdate,
  onStatusUpdate,
  apiConfig = DEFAULT_API_CONFIG
}) => {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    status: null,
    error: null,
    canCancel: false
  });

  // Store accumulated selections as processing continues
  const accumulatedSelections = useRef<Selection[]>([]);
  // Cancellation flag
  const shouldCancel = useRef<boolean>(false);

  /**
   * Handle chunk processing updates - markers appear immediately
   */
  const handleChunkProcessed = useCallback((
    chunkIndex: number,
    newSelections: Selection[],
    status: ProcessingStatus
  ) => {
    // Check for cancellation
    if (shouldCancel.current) {
      return;
    }

    // Add new selections to accumulated list (if any received)
    if (newSelections.length > 0) {
      accumulatedSelections.current.push(...newSelections);

      // Immediately update markers on waveform (real-time display)
      onSelectionsUpdate([...accumulatedSelections.current]);

      console.log(`Chunk ${chunkIndex + 1} processed: ${newSelections.length} new predictions added`);
    }

    // Update processing state
    setProcessingState(prev => ({
      ...prev,
      status,
      error: status.error || null
    }));

    // Call external status callback
    if (onStatusUpdate) {
      onStatusUpdate(status);
    }

    // If there's an error, processing will stop automatically
    if (status.error) {
      console.warn(`Processing stopped at chunk ${chunkIndex + 1}: ${status.error}`);
    }
  }, [onSelectionsUpdate, onStatusUpdate]);

  /**
   * Start real-time prediction processing
   */
  const startProcessing = useCallback(async () => {
    if (!audioElement) {
      setProcessingState(prev => ({
        ...prev,
        error: 'No audio element available for processing'
      }));
      return;
    }

    if (processingState.isProcessing) {
      console.warn('Processing already in progress');
      return;
    }

    try {
      // Reset state
      accumulatedSelections.current = [];
      shouldCancel.current = false;
      setProcessingState({
        isProcessing: true,
        status: null,
        error: null,
        canCancel: true
      });

      console.log(`Starting real-time prediction processing for audio: ${audioId}`);

      // Step 1: Chunk the audio
      console.log('Chunking audio into 5-second segments...');
      const chunks = await chunkAudio(audioElement, DEFAULT_CHUNKING_CONFIG);
      console.log(`Created ${chunks.length} audio chunks`);

      if (chunks.length === 0) {
        throw new Error('No audio chunks were created');
      }

      // Step 2: Process chunks sequentially (stops on first error)
      console.log('Starting sequential chunk processing...');
      await processChunksInRealtime(
        chunks,
        apiConfig,
        handleChunkProcessed,
        audioId
      );

      // Processing completed successfully (all chunks processed without errors)
      if (!shouldCancel.current) {
        console.log(`Processing completed successfully. Total selections: ${accumulatedSelections.current.length}`);
        setProcessingState(prev => ({
          ...prev,
          isProcessing: false,
          canCancel: false,
          error: null // Clear any previous errors on successful completion
        }));
      }

    } catch (error) {
      // Processing stopped due to error in one of the chunks
      console.error('Processing stopped due to error:', error);

      if (!shouldCancel.current) {
        setProcessingState(prev => ({
          ...prev,
          isProcessing: false,
          canCancel: false,
          error: error instanceof Error ? error.message : 'Unknown processing error'
        }));
      }
    }
  }, [audioElement, audioId, apiConfig, processingState.isProcessing, handleChunkProcessed]);

  /**
   * Cancel ongoing processing
   */
  const cancelProcessing = useCallback(() => {
    if (processingState.isProcessing && processingState.canCancel) {
      console.log('Cancelling real-time processing...');
      shouldCancel.current = true;
      setProcessingState(prev => ({
        ...prev,
        isProcessing: false,
        canCancel: false,
        error: 'Processing cancelled by user'
      }));
    }
  }, [processingState.isProcessing, processingState.canCancel]);

  /**
   * Clear accumulated selections and reset state
   */
  const clearSelections = useCallback(() => {
    accumulatedSelections.current = [];
    setProcessingState({
      isProcessing: false,
      status: null,
      error: null,
      canCancel: false
    });
    onSelectionsUpdate([]);
  }, [onSelectionsUpdate]);

  /**
   * Get current processing progress percentage
   */
  const getProgressPercentage = useCallback((): number => {
    if (!processingState.status) return 0;
    const { totalChunks, processedChunks } = processingState.status;
    return totalChunks > 0 ? Math.round((processedChunks / totalChunks) * 100) : 0;
  }, [processingState.status]);

  return (
    <div style={{
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#f9f9f9',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, color: '#FF9800' }}>Load LSTM Predictions</h4>

        {/* Start/Stop button */}
        <button
          onClick={processingState.isProcessing ? cancelProcessing : startProcessing}
          disabled={!audioElement}
          style={{
            padding: '6px 12px',
            backgroundColor: processingState.isProcessing ? '#f44336' : '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: audioElement ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
        >
          {processingState.isProcessing ? 'Cancel' : 'Start Processing'}
        </button>

        {/* Clear button */}
        {!processingState.isProcessing && accumulatedSelections.current.length > 0 && (
          <button
            onClick={clearSelections}
            style={{
              padding: '6px 12px',
              backgroundColor: '#9e9e9e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Status display */}
      {processingState.status && (
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
          Progress: {getProgressPercentage()}%
          ({processingState.status.processedChunks}/{processingState.status.totalChunks} chunks)
          {processingState.isProcessing && (
            <span> - Processing chunk {processingState.status.currentChunk + 1}... (markers appear immediately)</span>
          )}
        </div>
      )}

      {/* Selections count */}
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
        Predictions found: {accumulatedSelections.current.length}
      </div>

      {/* Error display */}
      {processingState.error && (
        <div style={{
          fontSize: '12px',
          color: '#f44336',
          backgroundColor: '#ffebee',
          padding: '4px 8px',
          borderRadius: '4px',
          marginTop: '4px'
        }}>
          Error: {processingState.error}
        </div>
      )}

      {/* Processing indicator */}
      {processingState.isProcessing && (
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#e0e0e0',
          borderRadius: '2px',
          marginTop: '8px',
          overflow: 'hidden'
        }}>
          <div
            style={{
              width: `${getProgressPercentage()}%`,
              height: '100%',
              backgroundColor: '#2196F3',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RealtimePredictionManager;
/**
 * API service for real-time prediction processing
 * 
 * This module handles sending audio chunks to the backend and receiving
 * predictions that can be displayed as markers in real-time.
 */

import { Selection } from '../model/types';
import { AudioChunk } from '@/shared/stores/wavesurfer/audioChunking';

/**
 * Configuration for prediction API
 */
export interface PredictionConfig {
  /** Backend API endpoint URL */
  apiUrl: string;
  /** Optional request timeout in milliseconds */
  timeout?: number;
}

/**
 * Response from the prediction API
 */
export interface PredictionResponse {
  /** Array of prediction timestamps in seconds */
  seconds: number[];
}

/**
 * Processing status for real-time updates
 */
export interface ProcessingStatus {
  /** Total number of chunks to process */
  totalChunks: number;
  /** Number of chunks processed so far */
  processedChunks: number;
  /** Current chunk being processed */
  currentChunk: number;
  /** Whether processing is complete */
  isComplete: boolean;
  /** Any error that occurred during processing */
  error?: string;
}

/**
 * Callback function for real-time updates
 */
export type OnChunkProcessed = (
  chunkIndex: number,
  selections: Selection[],
  status: ProcessingStatus
) => void;

/**
 * Send a single audio chunk to the prediction API
 * 
 * @param audioChunk - The audio chunk to process
 * @param config - API configuration
 * @returns Promise<PredictionResponse> - Predictions from the backend
 */
export async function sendChunkForPrediction(
  audioChunk: AudioChunk,
  config: PredictionConfig
): Promise<PredictionResponse> {
  const { apiUrl, timeout = 10000 } = config;

  try {
    // Create FormData to send the audio file
    const formData = new FormData();
    formData.append('file', audioChunk.audioBlob, `chunk_${audioChunk.index}.wav`);

    // Send the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response format
    if (!data || typeof data !== 'object' || !Array.isArray(data.seconds)) {
      throw new Error('Invalid response format: expected object with seconds array');
    }

    return {
      seconds: data.seconds,
    };

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }

    console.error(`Failed to process chunk ${audioChunk.index}:`, error);
    throw new Error(`Prediction API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process multiple audio chunks sequentially with real-time marker updates
 * 
 * Processes chunks one by one. If any chunk fails, stops processing immediately
 * and shows an error. Markers appear immediately as each chunk is processed.
 * 
 * @param audioChunks - Array of audio chunks to process
 * @param config - API configuration
 * @param onChunkProcessed - Callback for real-time updates (markers appear immediately)
 * @param audioId - ID of the audio file being processed
 * @returns Promise<Selection[]> - All selections from successfully processed chunks
 */
export async function processChunksInRealtime(
  audioChunks: AudioChunk[],
  config: PredictionConfig,
  onChunkProcessed: OnChunkProcessed,
  audioId: string
): Promise<Selection[]> {
  const allSelections: Selection[] = [];
  const totalChunks = audioChunks.length;

  for (let i = 0; i < audioChunks.length; i++) {
    const chunk = audioChunks[i];

    try {
      console.log(`Processing chunk ${i + 1}/${totalChunks} (${chunk.startTime.toFixed(1)}s - ${chunk.endTime.toFixed(1)}s)`);

      // Send chunk for prediction (sequential, one by one)
      const predictionResponse = await sendChunkForPrediction(chunk, config);

      // Convert predictions to selections
      const chunkSelections = createSelectionsFromPredictions(
        predictionResponse.seconds,
        chunk,
        audioId
      );

      // Add to total selections
      allSelections.push(...chunkSelections);

      // Update status - chunk completed successfully
      const completedStatus: ProcessingStatus = {
        totalChunks,
        processedChunks: i + 1,
        currentChunk: i,
        isComplete: i === audioChunks.length - 1
      };

      // Call callback immediately to show markers in real-time
      // This will cause markers to appear on the waveform immediately
      onChunkProcessed(i, chunkSelections, completedStatus);

      console.log(`Chunk ${i + 1} completed: received ${chunkSelections.length} predictions`);

    } catch (error) {
      console.error(`Failed to process chunk ${i + 1}/${totalChunks}:`, error);

      // Update status with error and stop processing
      const errorStatus: ProcessingStatus = {
        totalChunks,
        processedChunks: i,
        currentChunk: i,
        isComplete: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      // Call callback with error status to show error in UI
      onChunkProcessed(i, [], errorStatus);

      // STOP processing immediately on first error (as requested)
      // Do not continue with remaining chunks
      throw error;
    }
  }

  console.log(`Processing completed successfully. Total predictions: ${allSelections.length}`);
  return allSelections;
}

/**
 * Convert prediction timestamps to Selection objects, cropping padding
 * 
 * @param predictions - Array of prediction timestamps from padded chunk
 * @param chunk - The audio chunk these predictions came from
 * @param audioId - ID of the audio file
 * @returns Selection[] - Array of selection objects with padding cropped
 */
function createSelectionsFromPredictions(
  predictions: number[],
  chunk: AudioChunk,
  audioId: string
): Selection[] {
  const selections: Selection[] = [];
  const { actualLeftPadding } = chunk;

  // Calculate the valid time range within the padded chunk using actual padding
  const chunkDurationInPaddedChunk = chunk.endTime - chunk.startTime;
  const validStartTime = actualLeftPadding;
  const validEndTime = actualLeftPadding + chunkDurationInPaddedChunk;

  predictions.forEach((timestamp, index) => {
    // Only include predictions that fall within the valid range (excluding padding)
    if (timestamp >= validStartTime && timestamp <= validEndTime) {
      // Adjust timestamp: subtract actual left padding, then add original chunk start time
      const adjustedTimestamp = timestamp - actualLeftPadding;
      const globalTimestamp = chunk.startTime + adjustedTimestamp;

      selections.push({
        id: `prediction_${chunk.index}_${index}`,
        beginTime: globalTimestamp,
        endTime: globalTimestamp + 0.001, // Very small duration for click markers
        audioId: audioId
      });
    }
  });

  return selections;
}

/**
 * Validate that predictions are within valid time ranges
 * 
 * @param predictions - Array of prediction timestamps
 * @param maxDuration - Maximum valid duration (chunk duration)
 * @returns number[] - Filtered valid predictions
 */
export function validatePredictions(
  predictions: number[],
  maxDuration: number
): number[] {
  return predictions.filter(timestamp =>
    typeof timestamp === 'number' &&
    timestamp >= 0 &&
    timestamp <= maxDuration &&
    !isNaN(timestamp)
  );
}
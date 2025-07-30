/**
 * Audio chunking utilities for real-time prediction processing
 * 
 * This module provides functionality to split audio into chunks and send them
 * to the backend for processing, receiving predictions in real-time.
 */

/**
 * Represents a chunk of audio data with metadata
 */
export interface AudioChunk {
  /** Chunk index starting from 0 */
  index: number;
  /** Start time of this chunk in the original audio (seconds) */
  startTime: number;
  /** End time of this chunk in the original audio (seconds) */
  endTime: number;
  /** Duration of this chunk (seconds) */
  duration: number;
  /** Audio blob containing the chunk data */
  audioBlob: Blob;
}

/**
 * Configuration for audio chunking
 */
export interface ChunkingConfig {
  /** Duration of each chunk in seconds */
  chunkDuration: number;
  /** Overlap between chunks in seconds (optional) */
  overlapDuration?: number;
}

/**
 * Split an audio element into chunks of specified duration
 * 
 * @param audioElement - The source audio element
 * @param config - Chunking configuration
 * @returns Promise<AudioChunk[]> - Array of audio chunks
 */
export async function chunkAudio(
  audioElement: HTMLAudioElement,
  config: ChunkingConfig
): Promise<AudioChunk[]> {
  const { chunkDuration, overlapDuration = 0 } = config;

  try {
    // Create an audio context for processing
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Get the audio buffer from the audio element
    const audioBuffer = await getAudioBuffer(audioElement, audioContext);

    const totalDuration = audioBuffer.duration;
    const chunks: AudioChunk[] = [];

    let currentTime = 0;
    let chunkIndex = 0;

    while (currentTime < totalDuration) {
      const endTime = Math.min(currentTime + chunkDuration, totalDuration);
      const actualDuration = endTime - currentTime;

      // Skip if chunk is too small (less than 0.1 seconds)
      if (actualDuration < 0.1) {
        break;
      }

      // Extract this chunk
      const chunkBlob = await extractAudioChunk(
        audioBuffer,
        audioContext,
        currentTime,
        endTime
      );

      chunks.push({
        index: chunkIndex,
        startTime: currentTime,
        endTime: endTime,
        duration: actualDuration,
        audioBlob: chunkBlob
      });

      // Move to next chunk (with overlap consideration)
      currentTime += chunkDuration - overlapDuration;
      chunkIndex++;
    }

    // Clean up the audio context
    await audioContext.close();

    return chunks;

  } catch (error) {
    console.error('Failed to chunk audio:', error);
    throw new Error(`Audio chunking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract a specific time range from an audio buffer as a WAV blob
 */
async function extractAudioChunk(
  audioBuffer: AudioBuffer,
  audioContext: AudioContext,
  startTime: number,
  endTime: number
): Promise<Blob> {
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);

  // Ensure we don't exceed buffer bounds
  const actualStartSample = Math.max(0, startSample);
  const actualEndSample = Math.min(audioBuffer.length, endSample);
  const actualDuration = actualEndSample - actualStartSample;

  if (actualDuration <= 0) {
    throw new Error('Invalid time range for chunk extraction');
  }

  // Create a new buffer for the chunk
  const chunkBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    actualDuration,
    sampleRate
  );

  // Copy the audio data for each channel
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const targetData = chunkBuffer.getChannelData(channel);

    for (let i = 0; i < actualDuration; i++) {
      targetData[i] = sourceData[actualStartSample + i];
    }
  }

  // Convert the chunk buffer to a WAV blob
  return audioBufferToWav(chunkBuffer);
}

/**
 * Convert an audio element to an AudioBuffer
 */
async function getAudioBuffer(
  audioElement: HTMLAudioElement,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    // Fetch the audio data
    fetch(audioElement.src)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.statusText}`);
        }
        return response.arrayBuffer();
      })
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(resolve)
      .catch(reject);
  });
}

/**
 * Convert an AudioBuffer to a WAV blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2; // 16-bit PCM

  // Calculate sizes
  const dataSize = length * numberOfChannels * bytesPerSample;
  const fileSize = 44 + dataSize; // WAV header is 44 bytes

  // Create array buffer for the WAV file
  const arrayBuffer = new ArrayBuffer(fileSize);
  const view = new DataView(arrayBuffer);

  // WAV file header
  let offset = 0;

  // RIFF chunk descriptor
  writeString(view, offset, 'RIFF'); offset += 4;
  view.setUint32(offset, fileSize - 8, true); offset += 4; // File size - 8 bytes
  writeString(view, offset, 'WAVE'); offset += 4;

  // fmt sub-chunk
  writeString(view, offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4; // Sub-chunk size (16 for PCM)
  view.setUint16(offset, 1, true); offset += 2; // Audio format (1 for PCM)
  view.setUint16(offset, numberOfChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * numberOfChannels * bytesPerSample, true); offset += 4; // Byte rate
  view.setUint16(offset, numberOfChannels * bytesPerSample, true); offset += 2; // Block align
  view.setUint16(offset, bytesPerSample * 8, true); offset += 2; // Bits per sample

  // data sub-chunk
  writeString(view, offset, 'data'); offset += 4;
  view.setUint32(offset, dataSize, true); offset += 4;

  // Audio data
  const channels: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let sampleOffset = offset;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      // Convert float sample to 16-bit PCM
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      const pcmSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(sampleOffset, pcmSample, true);
      sampleOffset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Write a string to a DataView at the specified offset
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
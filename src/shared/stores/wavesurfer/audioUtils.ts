/**
 * Audio processing utilities for WaveSurfer region extraction
 * 
 * This module provides functionality to extract audio data from specific time regions
 * and create new audio blobs that can be used for separate waveform instances.
 */

/**
 * Extract audio data from a specific time region of an audio element
 * 
 * @param audioElement - The source audio element
 * @param startTime - Start time in seconds
 * @param endTime - End time in seconds
 * @returns Promise<Blob> - Audio blob containing only the extracted region
 */
export async function extractAudioRegion(
  audioElement: HTMLAudioElement,
  startTime: number,
  endTime: number
): Promise<Blob> {
  try {
    // Create an audio context for processing
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Get the audio buffer from the audio element
    const audioBuffer = await getAudioBuffer(audioElement, audioContext);

    // Calculate the sample range to extract
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.floor(endTime * sampleRate);

    // Ensure we don't exceed buffer bounds
    const actualStartSample = Math.max(0, startSample);
    const actualEndSample = Math.min(audioBuffer.length, endSample);
    const actualDuration = actualEndSample - actualStartSample;

    if (actualDuration <= 0) {
      throw new Error('Invalid time range for audio extraction');
    }

    // Create a new buffer for the extracted region
    const extractedBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      actualDuration,
      sampleRate
    );

    // Copy the audio data for each channel
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const sourceData = audioBuffer.getChannelData(channel);
      const targetData = extractedBuffer.getChannelData(channel);

      for (let i = 0; i < actualDuration; i++) {
        targetData[i] = sourceData[actualStartSample + i];
      }
    }

    // Convert the extracted buffer to a WAV blob
    const wavBlob = audioBufferToWav(extractedBuffer);

    // Clean up the audio context
    await audioContext.close();

    return wavBlob;

  } catch (error) {
    console.error('Failed to extract audio region:', error);
    throw new Error(`Audio extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert an audio element to an AudioBuffer
 */
async function getAudioBuffer(
  audioElement: HTMLAudioElement,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    // Check if we can get the audio data directly
    if (audioElement.src.startsWith('blob:') || audioElement.src.startsWith('data:')) {
      // For blob URLs or data URLs, we need to fetch the data
      fetch(audioElement.src)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(resolve)
        .catch(reject);
    } else {
      // For regular URLs, we also need to fetch
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
    }
  });
}

/**
 * Convert an AudioBuffer to a WAV blob
 * 
 * This function creates a proper WAV file from the audio buffer data
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

/**
 * Create a blob URL from an audio blob for use with audio elements
 */
export function createAudioBlobURL(audioBlob: Blob): string {
  return URL.createObjectURL(audioBlob);
}

/**
 * Revoke a blob URL to free memory
 */
export function revokeBlobURL(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Validate that a time range is suitable for audio extraction
 */
export function validateTimeRange(
  startTime: number,
  endTime: number,
  audioDuration: number
): { isValid: boolean; error?: string } {
  if (startTime < 0) {
    return { isValid: false, error: 'Start time cannot be negative' };
  }

  if (endTime > audioDuration) {
    return { isValid: false, error: 'End time cannot exceed audio duration' };
  }

  if (startTime >= endTime) {
    return { isValid: false, error: 'Start time must be less than end time' };
  }

  return { isValid: true };
}

/**
 * Get estimated file size for an audio region
 */
export function estimateRegionSize(
  startTime: number,
  endTime: number,
  sampleRate: number = 44100,
  channels: number = 2,
  bitsPerSample: number = 16
): number {
  const duration = endTime - startTime;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = duration * sampleRate * channels * bytesPerSample;
  const headerSize = 44; // WAV header size

  return Math.ceil(dataSize + headerSize);
}
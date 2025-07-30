import { Selection, SelectionGroup } from '../model/types';
import { SelectionFile } from '@/shared/config/audioFiles';

/**
 * Fetches and parses selection data from a text file that contains click timestamps
 */
export const fetchSelections = async (selectionFile: SelectionFile): Promise<Selection[]> => {
  try {
    const response = await fetch(selectionFile.url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();

    // Parse the selections from the new format and add source and color information
    return parseClickTimestamps(data, selectionFile);
  } catch (error) {
    console.error(`Error loading selections from ${selectionFile.url}:`, error);
    return [];
  }
};

/**
 * Fetches multiple selection files and organizes them into selection groups
 */
export const fetchMultipleSelections = async (selectionFiles: SelectionFile[]): Promise<SelectionGroup[]> => {
  try {
    const selectionGroups: SelectionGroup[] = [];

    // Process each selection file in parallel
    const promises = selectionFiles.map(async (file) => {
      const selections = await fetchSelections(file);
      return {
        id: file.id,
        name: file.name,
        color: file.color,
        description: file.description,
        selections
      };
    });

    // Wait for all selection files to be processed
    const results = await Promise.all(promises);

    // Add successful results to the selection groups
    results.forEach(group => {
      if (group.selections.length > 0) {
        selectionGroups.push(group);
      }
    });

    return selectionGroups;
  } catch (error) {
    console.error('Error loading multiple selection files:', error);
    return [];
  }
};

/**
 * Parses the new click timestamps format where each line contains an array of click times
 * Format: "0,19620917a.wav,"[0.193, 0.374, 0.508, 0.692, 0.695, 0.951, 1.111, 1.17]""
 */
const parseClickTimestamps = (data: string, selectionFile: SelectionFile): Selection[] => {
  const lines = data.split('\n');
  const selections: Selection[] = [];

  // Skip header row if it exists
  const startLine = lines[0]?.includes(',file_name,clicks:') ? 1 : 0;

  // Process each data row
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      // Parse the CSV-like format - look for row index, filename, and timestamps array
      const match = line.match(/(\d+),([^,]+),"(\[.*?\])"/);

      if (match && match.length >= 4) {
        const rowIndex = match[1];
        const fileName = match[2];
        const timestampsJson = match[3];

        // Parse the JSON array of timestamps 
        const timestamps = JSON.parse(timestampsJson);

        // Extract the audio ID from the filename (remove file extension)
        const audioId = fileName.split('.')[0];

        // Create a selection for each timestamp
        timestamps.forEach((timestamp: number, index: number) => {
          selections.push({
            id: `${rowIndex}-${index}`,
            beginTime: timestamp,
            endTime: timestamp + 0.01, // Minimal duration
            source: selectionFile.id,
            color: selectionFile.color,
            name: fileName, // Store the full filename for easier filtering
            audioId: audioId // Store the audio ID directly for filtering
          });
        });
      }
    } catch (error) {
      console.error(`Error parsing line ${i}: ${line}`, error);
    }
  }

  return selections;
};

/*
 * Legacy parser for the original tab-delimited format
 * Kept for backward compatibility
 
const parseSelections = (data: string): Selection[] => {
  const lines = data.split('\n');
  const parsedSelections: Selection[] = [];
  const processedIds = new Set<number>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    const parts = line.split('\t');

    if (parts.length >= 5) {
      const id = parseInt(parts[0]);

      if (processedIds.has(id)) {
        continue;
      }

      processedIds.add(id);

      parsedSelections.push({
        id: id.toString(),
        beginTime: parseFloat(parts[3]),
        endTime: parseFloat(parts[4])
      });
    }
  }

  return parsedSelections;
};
*/ 
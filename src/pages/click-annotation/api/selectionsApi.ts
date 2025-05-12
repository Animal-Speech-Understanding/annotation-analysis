import { Selection } from '../model/types';

/**
 * Fetches and parses selection data from the text file
 */
export const fetchSelections = async (): Promise<Selection[]> => {
  try {
    const response = await fetch('/static/19840322a.selections.txt');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();
    return parseSelections(data);
  } catch (error) {
    console.error('Error loading selections:', error);
    return [];
  }
};

/**
 * Parses the selections text file content into Selection objects
 */
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
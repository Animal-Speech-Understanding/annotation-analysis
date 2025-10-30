export interface SelectionFile {
  id: string;
  name: string;
  url: string;
  color: string;
  description: string;
}

export interface AudioFile {
  id: string;
  title?: string;
  description?: string;
  url: string;
}

export interface AlgorithmConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  selectionUrl: string;
}

// Audio files database
export const audioFiles: AudioFile[] = [
  {
    id: '19620917a',
    title: 'Sperm Whale Recording 17-Sep-1962A',
    description: 'Watkins Marine Mammal Sound Database',
    url: '/static/audio/19620917a.wav',
  },
  {
    id: '19620917b',
    title: 'Sperm Whale Recording 17-Sep-1962B',
    description: 'Watkins Marine Mammal Sound Database',
    url: '/static/audio/19620917b.wav',
  },
  {
    id: '19720806f',
    title: 'Sperm Whale Recording 6-Aug-1972F',
    description: 'Watkins Marine Mammal Sound Database',
    url: '/static/audio/19720806f.wav',
  },
  {
    id: '19840322a',
    title: 'Sperm Whale Recording 22-Mar-1984A',
    description: 'Watkins Marine Mammal Sound Database',
    url: '/static/audio/19840322a.wav',
  },
  {
    id: '19911021b',
    title: 'Sperm Whale Recording 21-Oct-1991B',
    description: 'Watkins Marine Mammal Sound Database',
    url: '/static/audio/19911021b.wav',
  },
  {
    id: '94004005',
    title: 'Sperm Whale Recording 05-May-1994',
    url: '/static/audio/94004005.wav',
    description: ' Watkins Marine Mammal Sound Database',
  },
  {
    id: '75003044',
    title: 'Common Dolphin Recording 8-Sep-1975',
    url: '/static/audio/75003044.wav',
    description: 'Watkins Marine Mammal Sound Database',
  },
];

// Detection algorithms with their respective selection files
export const detectionAlgorithms: AlgorithmConfig[] = [
  {
    id: 'true',
    name: 'True Clicks',
    description: 'Hand-labeled click timestamps by marine biologists',
    color: '#4CAF50', // Green
    selectionUrl: '/static/selections/watkins_5_trues.csv',
  },
  {
    id: 'lstm',
    name: 'LSTM Preloaded',
    description: 'LSTM-based click detection',
    color: '#2196F3', // Blue
    selectionUrl: '/static/selections/watkins_5_predictions.csv',
  },
];

// Function to convert algorithm configs to selection files
export const getSelectionFilesFromAlgorithms = (): SelectionFile[] => {
  return detectionAlgorithms.map((algorithm) => ({
    id: algorithm.id,
    name: algorithm.name,
    url: algorithm.selectionUrl,
    color: algorithm.color,
    description: algorithm.description,
  }));
};

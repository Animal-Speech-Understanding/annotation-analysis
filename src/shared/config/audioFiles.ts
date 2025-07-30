export interface SelectionFile {
  id: string;
  name: string;
  url: string;
  color: string;
  description: string;
}

export interface AudioFile {
  id: string;
  title: string;
  description: string;
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
    title: 'Sperm Whale Recording 1962-09-17A',
    description: 'Early recording of sperm whale from the 1960s expeditions.',
    url: '/static/audio/19620917a.wav'
  },
  {
    id: '19620917b',
    title: 'Sperm Whale Recording 1962-09-17B',
    description: 'Sperm whale vocalization recorded in the Gulf of Mexico. Contains multiple click patterns and codas.',
    url: '/static/audio/19620917b.wav'
  },
  {
    id: '19720806f',
    title: 'Sperm Whale Recording 1972-08-06F',
    description: 'Secondary recording from the same session. Features different individuals and communication patterns.',
    url: '/static/audio/19720806f.wav'
  },
  {
    id: '19840322a',
    title: 'Sperm Whale Recording 1984-03-22A',
    description: 'Recorded near Dominica. Notable for containing rare synchronized codas between multiple individuals.',
    url: '/static/audio/19840322a.wav'
  },
  {
    id: '19911021b',
    title: 'Sperm Whale Recording 1991-10-21B',
    description: 'Recorded near Dominica. Notable for containing rare synchronized codas between multiple individuals.',
    url: '/static/audio/19911021b.wav'
  }
];

// Detection algorithms with their respective selection files
export const detectionAlgorithms: AlgorithmConfig[] = [
  {
    id: 'true',
    name: 'True Clicks',
    description: 'Hand-labeled click timestamps by marine biologists',
    color: '#4CAF50', // Green
    selectionUrl: '/static/selections/watkins_5_trues.csv'
  },
  {
    id: 'lstm',
    name: 'LSTM Preloaded',
    description: 'LSTM-based click detection',
    color: '#2196F3', // Blue
    selectionUrl: '/static/selections/watkins_5_predictions.csv'
  },
];

// Function to convert algorithm configs to selection files
export const getSelectionFilesFromAlgorithms = (): SelectionFile[] => {
  return detectionAlgorithms.map(algorithm => ({
    id: algorithm.id,
    name: algorithm.name,
    url: algorithm.selectionUrl,
    color: algorithm.color,
    description: algorithm.description
  }));
}; 
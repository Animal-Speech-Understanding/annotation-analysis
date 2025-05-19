/**
 * Represents a selection from the audio file
 */
export interface Selection {
  id: string;
  beginTime: number;
  endTime: number;
}

/**
 * Controls which types of markers are visible
 */
export interface MarkerVisibility {
  begin: boolean;
  middle: boolean;
  end: boolean;
}

export type MarkerType = 'begin' | 'middle' | 'end';

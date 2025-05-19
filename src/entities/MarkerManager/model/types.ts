/**
 * Represents a selection from the audio file
 */
export interface Selection {
  id: string;
  beginTime: number;
  endTime: number;
  source?: string;
  color?: string;
  name?: string;
  audioId?: string;
}

/**
 * Represents a collection of selections from a specific source
 */
export interface SelectionGroup {
  id: string;
  name: string;
  color: string;
  description: string;
  selections: Selection[];
  visible?: boolean;
}

/**
 * Controls which selection groups are visible
 */
export interface SelectionVisibility {
  [groupId: string]: boolean;
}

// Legacy type, kept for backward compatibility
export interface MarkerVisibility {
  begin: boolean;
  middle: boolean;
  end: boolean;
}

export type MarkerType = 'begin';

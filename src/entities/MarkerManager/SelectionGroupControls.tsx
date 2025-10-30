import React from 'react';
import { SelectionGroup, SelectionVisibility } from './model/types';

interface SelectionGroupControlsProps {
  selectionGroups: SelectionGroup[];
  visibility: SelectionVisibility;
  onVisibilityChange: (visibility: SelectionVisibility) => void;
  currentAudioId: string;
}

/**
 * Component for controlling which selection groups are displayed
 */
export const SelectionGroupControls: React.FC<SelectionGroupControlsProps> = ({
  selectionGroups,
  visibility,
  onVisibilityChange,
  currentAudioId,
}) => {
  const handleCheckboxChange = (groupId: string) => {
    onVisibilityChange({
      ...visibility,
      [groupId]: !visibility[groupId],
    });
  };

  /**
   * Count clicks that are relevant to the current audio file
   */
  const getClickCountForCurrentAudio = (group: SelectionGroup): number => {
    if (!currentAudioId) return 0;

    // Filter selections to only include those from the current audio file
    // Now we can directly use the stored audioId or name field
    return group.selections.filter((selection) => {
      // First try to use the dedicated audioId field
      if (selection.audioId) {
        return selection.audioId.toLowerCase() === currentAudioId.toLowerCase();
      }

      // Fallback to checking the name field (filename)
      if (selection.name) {
        return selection.name.toLowerCase().includes(currentAudioId.toLowerCase());
      }

      return false;
    }).length;
  };

  return (
    <div
      style={{
        margin: '10px 0 20px 0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      {selectionGroups.map((group) => {
        const clickCount = getClickCountForCurrentAudio(group);

        if (clickCount === 0) {
          return null;
        }

        return (
          <label
            key={group.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              backgroundColor: visibility[group.id] !== false ? '#f5f5f5' : '#e0e0e0',
              borderLeft: `4px solid ${group.color}`,
              opacity: clickCount > 0 ? 1 : 0.7,
            }}
          >
            <input
              type='checkbox'
              checked={visibility[group.id] ?? true}
              onChange={() => handleCheckboxChange(group.id)}
              style={{ marginRight: '8px' }}
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{group.name}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                {clickCount > 0 ? `${clickCount} clicks in this file` : 'No clicks in this file'}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
};

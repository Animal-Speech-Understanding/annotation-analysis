import React from 'react';

interface LegendProps {
  selectionCount: number;
}

/**
 * Displays a legend explaining the marker colors
 */
export const Legend: React.FC<LegendProps> = ({ selectionCount }) => {
  return (
    <div style={{ marginTop: "10px" }}>
      <p>{selectionCount} selections</p>
    </div>
  );
}; 
// Define a list of predefined colors for regions
export const REGION_COLORS = [
  'rgba(255, 0, 0, 0.2)',    // Red
  'rgba(0, 255, 0, 0.2)',    // Green
  'rgba(0, 0, 255, 0.2)',    // Blue
  'rgba(255, 255, 0, 0.2)',  // Yellow
  'rgba(255, 0, 255, 0.2)',  // Magenta
  'rgba(0, 255, 255, 0.2)',  // Cyan
  'rgba(255, 165, 0, 0.2)',  // Orange
  'rgba(128, 0, 128, 0.2)',  // Purple
];

/**
 * Color manager for waveform regions
 */
export class RegionColorManager {
  private colorIndex: number = 0;

  /**
   * Get the next color from the predefined list
   */
  getNextColor(): string {
    const color = REGION_COLORS[this.colorIndex % REGION_COLORS.length];
    this.colorIndex = (this.colorIndex + 1) % REGION_COLORS.length;
    return color;
  }

  /**
   * Reset the color index back to the beginning
   */
  reset(): void {
    this.colorIndex = 0;
  }
} 
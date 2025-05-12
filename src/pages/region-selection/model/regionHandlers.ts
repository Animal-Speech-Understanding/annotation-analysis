import { Region } from 'wavesurfer.js/dist/plugins/regions.js';
import { RegionColorManager } from './regionColors';

interface RegionHandlersOptions {
  onRegionCreated?: (region: Region) => void;
  onRegionSelected?: (region: Region | null) => void;
  onRegionRemoved?: (region: Region) => void;
  selectedRegionRef: React.RefObject<Region | null>;
  colorManagerRef: React.RefObject<RegionColorManager>;
  updateSelectedRegion: (region: Region | null) => void;
}

export function createRegionHandlers({
  onRegionCreated,
  selectedRegionRef,
  colorManagerRef,
  updateSelectedRegion
}: RegionHandlersOptions) {
  /**
   * Handle region selection
   */
  const handleRegionSelected = (region: Region) => {
    // Skip if it's already the selected region (prevent unnecessary operations)
    if (selectedRegionRef.current && selectedRegionRef.current.id === region.id) return;

    // Use the combined update function
    updateSelectedRegion(region);
  };

  /**
   * Handle region creation
   */
  const handleRegionCreated = (region: Region) => {
    console.log("Region created:", region.id);

    console.log('New region element:', region.element);
    console.log('part attribute:', region.element.getAttribute('part'));

    // Assign a color to this region using the color manager
    const color = colorManagerRef.current.getNextColor();
    region.setOptions({ color });

    if (onRegionCreated) {
      onRegionCreated(region);
    }
    handleRegionSelected(region);
  };

  /**
   * Handle region update
   */
  const handleRegionUpdated = (region: Region) => {
    console.log("Region updated:", region.id);
    // Update the selected region if this is the currently selected one
    if (selectedRegionRef.current && selectedRegionRef.current.id === region.id) {
      // Use the combined update function
      updateSelectedRegion(region);
    }
  };

  /**
   * Handle region click
   */
  const handleRegionClicked = (region: Region) => {
    console.log("Region clicked:", region.id);
    handleRegionSelected(region);
  };

  return {
    handleRegionSelected,
    handleRegionCreated,
    handleRegionUpdated,
    handleRegionClicked,
  };
} 
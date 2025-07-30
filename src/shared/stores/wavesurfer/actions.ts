import { Region } from 'wavesurfer.js/dist/plugins/regions';
import { useWaveSurferStore, setEventListenersReset } from './store';
import { RegionColorManager, REGION_COLORS } from './regionColors';

/**
 * Color manager singleton for consistent color assignment
 */
const colorManager = new RegionColorManager();

/**
 * Minimum region duration in seconds (WaveSurfer.js limitation)
 */
const MIN_REGION_DURATION = 0.065;

/**
 * Singleton region handlers to prevent duplicate event listeners
 */
let regionHandlers: {
  handleRegionCreated: (region: Region) => void;
  handleRegionUpdated: (region: Region) => void;
  handleRegionClicked: (region: Region) => void;
} | null = null;

/**
 * Validate and adjust region duration to meet minimum requirements
 */
function validateAndAdjustRegion(region: Region): { isValid: boolean; adjustedRegion?: { start: number; end: number } } {
  const duration = region.end - region.start;

  if (duration >= MIN_REGION_DURATION) {
    return { isValid: true };
  }

  // Calculate adjustment needed
  const neededDuration = MIN_REGION_DURATION;
  const midPoint = (region.start + region.end) / 2;
  const halfDuration = neededDuration / 2;

  let adjustedStart = midPoint - halfDuration;
  let adjustedEnd = midPoint + halfDuration;

  // Ensure we don't go below 0
  if (adjustedStart < 0) {
    adjustedStart = 0;
    adjustedEnd = neededDuration;
  }

  // TODO: We should also check against audio duration, but we don't have it here
  // The audio duration check will be handled in the extraction validation

  return {
    isValid: false,
    adjustedRegion: {
      start: adjustedStart,
      end: adjustedEnd
    }
  };
}

/**
 * Region event handler factory that integrates with the store
 * 
 * This replaces the old createRegionHandlers function and directly
 * uses the Zustand store for state management.
 */
export const createStoreRegionHandlers = () => {
  // Return existing handlers if they exist to prevent duplicates
  if (regionHandlers) {
    return regionHandlers;
  }

  const handleRegionCreated = (region: Region) => {
    console.log("Region created:", region.id);

    // Validate and adjust region if needed
    const validation = validateAndAdjustRegion(region);

    if (!validation.isValid && validation.adjustedRegion) {
      console.log(`Region too small (${(region.end - region.start).toFixed(3)}s), adjusting to minimum ${MIN_REGION_DURATION}s`);

      // Adjust the region to meet minimum duration
      try {
        region.setOptions({
          start: validation.adjustedRegion.start,
          end: validation.adjustedRegion.end
        });

        // Show user-friendly notification
        const store = useWaveSurferStore.getState();
        store.setError(`Region expanded to minimum duration (${MIN_REGION_DURATION}s)`);

        // Clear the error after 3 seconds
        setTimeout(() => {
          const currentStore = useWaveSurferStore.getState();
          if (currentStore.initializationState.error?.includes('minimum duration')) {
            currentStore.setError(null);
          }
        }, 3000);

      } catch (error) {
        console.error('Failed to adjust region:', error);
        // If we can't adjust, just proceed with the original region
      }
    }

    // Assign a color to this region
    const color = colorManager.getNextColor();
    region.setOptions({ color });

    // Update store and trigger callbacks
    const { callbacks } = useWaveSurferStore.getState();
    if (callbacks.onRegionCreated) {
      callbacks.onRegionCreated(region);
    }

    // Auto-select the newly created region
    useWaveSurferStore.getState().selectRegion(region);
  };

  const handleRegionUpdated = (region: Region) => {
    console.log("Region updated:", region.id);

    // Validate updated region
    const validation = validateAndAdjustRegion(region);

    if (!validation.isValid && validation.adjustedRegion) {
      console.log(`Updated region too small, adjusting to minimum ${MIN_REGION_DURATION}s`);

      try {
        region.setOptions({
          start: validation.adjustedRegion.start,
          end: validation.adjustedRegion.end
        });
      } catch (error) {
        console.error('Failed to adjust updated region:', error);
      }
    }

    const { selectedRegion } = useWaveSurferStore.getState();
    if (selectedRegion.region && selectedRegion.region.id === region.id) {
      // Update the selected region if this is the currently selected one
      useWaveSurferStore.getState().selectRegion(region);
    }

    // Trigger callback
    const { callbacks } = useWaveSurferStore.getState();
    if (callbacks.onRegionUpdated) {
      callbacks.onRegionUpdated(region);
    }
  };

  const handleRegionClicked = (region: Region) => {
    console.log("Region clicked:", region.id);

    const { selectedRegion } = useWaveSurferStore.getState();

    // Skip if it's already the selected region
    if (selectedRegion.region && selectedRegion.region.id === region.id) {
      return;
    }

    useWaveSurferStore.getState().selectRegion(region);
  };

  // Store handlers in singleton to prevent duplicates
  regionHandlers = {
    handleRegionCreated,
    handleRegionUpdated,
    handleRegionClicked,
  };

  return regionHandlers;
};

/**
 * Track if event listeners are already set up to prevent duplicates
 */
let eventListenersSetup = false;

/**
 * Setup region event listeners for the main WaveSurfer instance
 * This should be called after the regions plugin is created
 */
export const setupRegionEventListeners = () => {
  const { regionsPlugin } = useWaveSurferStore.getState();

  if (!regionsPlugin) {
    console.warn('Cannot setup region event listeners: regions plugin not found');
    return;
  }

  // Prevent duplicate setup
  if (eventListenersSetup) {
    console.log('Region event listeners already set up, skipping...');
    return;
  }

  const handlers = createStoreRegionHandlers();

  // Add the event listeners
  regionsPlugin.on('region-created', handlers.handleRegionCreated);
  regionsPlugin.on('region-updated', handlers.handleRegionUpdated);
  regionsPlugin.on('region-clicked', handlers.handleRegionClicked);

  // Enable drag selection with the next color
  regionsPlugin.enableDragSelection({
    color: colorManager.getNextColor(),
  });

  eventListenersSetup = true;
  console.log('Region event listeners set up successfully');

  const cleanup = () => {
    // Cleanup function
    if (regionsPlugin && handlers) {
      regionsPlugin.un('region-created', handlers.handleRegionCreated);
      regionsPlugin.un('region-updated', handlers.handleRegionUpdated);
      regionsPlugin.un('region-clicked', handlers.handleRegionClicked);
      eventListenersSetup = false;
      regionHandlers = null; // Reset handlers
      console.log('Region event listeners cleaned up');
    }
  };

  // Register the cleanup function with the store
  setEventListenersReset(() => {
    cleanup();
    eventListenersSetup = false;
    regionHandlers = null;
  });

  return cleanup;
};

/**
 * Enhanced clear regions that also resets the color manager
 */
export const clearRegionsWithColorReset = () => {
  const store = useWaveSurferStore.getState();

  // Clear regions using store method
  store.clearRegions();

  // Reset color manager
  colorManager.reset();

  // Re-enable drag selection with fresh color
  const { regionsPlugin } = store;
  if (regionsPlugin) {
    regionsPlugin.enableDragSelection({
      color: colorManager.getNextColor(),
    });
  }
};

/**
 * Action creators for common WaveSurfer operations
 * These provide a higher-level API that can be easily used by components
 */
export const waveSurferActions = {
  /**
   * Initialize the main WaveSurfer with automatic region setup
   */
  async initializeMainWithRegions(container: HTMLDivElement, audioElement: HTMLAudioElement) {
    const store = useWaveSurferStore.getState();

    await store.initializeMain(container, audioElement);

    // Setup region event listeners after initialization
    setupRegionEventListeners();
  },

  /**
   * Clear all regions and reset colors
   */
  clearAll() {
    clearRegionsWithColorReset();
  },

  /**
   * Reset the entire store to initial state
   */
  reset() {
    const store = useWaveSurferStore.getState();
    store.destroy();
    colorManager.reset();

    // Reset event listener state
    eventListenersSetup = false;
    regionHandlers = null;
  },

  /**
   * Get current color manager state (for debugging)
   */
  getColorManagerState() {
    return {
      currentIndex: colorManager['colorIndex'], // Access private property for debugging
      availableColors: REGION_COLORS,
    };
  },
};
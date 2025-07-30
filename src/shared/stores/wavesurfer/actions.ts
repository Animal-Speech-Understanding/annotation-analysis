import { Region } from 'wavesurfer.js/dist/plugins/regions';
import { useWaveSurferStore } from './store';
import { RegionColorManager, REGION_COLORS } from './regionColors';

/**
 * Color manager singleton for consistent color assignment
 */
const colorManager = new RegionColorManager();

/**
 * Region event handler factory that integrates with the store
 * 
 * This replaces the old createRegionHandlers function and directly
 * uses the Zustand store for state management.
 */
export const createStoreRegionHandlers = () => {

  const handleRegionCreated = (region: Region) => {
    console.log("Region created:", region.id);

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

  return {
    handleRegionCreated,
    handleRegionUpdated,
    handleRegionClicked,
  };
};

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

  const handlers = createStoreRegionHandlers();

  // Remove any existing listeners to prevent duplicates
  regionsPlugin.un('region-created', handlers.handleRegionCreated);
  regionsPlugin.un('region-updated', handlers.handleRegionUpdated);
  regionsPlugin.un('region-clicked', handlers.handleRegionClicked);

  // Add the new listeners
  regionsPlugin.on('region-created', handlers.handleRegionCreated);
  regionsPlugin.on('region-updated', handlers.handleRegionUpdated);
  regionsPlugin.on('region-clicked', handlers.handleRegionClicked);

  // Enable drag selection with the next color
  regionsPlugin.enableDragSelection({
    color: colorManager.getNextColor(),
  });

  return () => {
    // Cleanup function
    regionsPlugin.un('region-created', handlers.handleRegionCreated);
    regionsPlugin.un('region-updated', handlers.handleRegionUpdated);
    regionsPlugin.un('region-clicked', handlers.handleRegionClicked);
  };
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
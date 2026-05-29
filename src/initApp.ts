/**
 * Application initialization
 * This file contains code that should run at application startup
 */

import { descriptionCache } from './services/descriptionCache';

/**
 * Initializes the application
 */
export const initApp = () => {
  console.log('[App] Initializing application...');
  
  // Clean expired cache on startup
  descriptionCache.clearErrors();
  descriptionCache.cleanup();
  
  console.log('[App] Application initialized successfully');
  
  // Set interval for periodic cache cleanup (every hour)
  setInterval(() => {
    descriptionCache.cleanup();
  }, 60 * 60 * 1000); // 1 hour
  
  console.log('[App] Cache cleanup interval set (every hour)');
};
'use client';

import { useEffect } from 'react';

export function DatabaseInitializer() {
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        // Call the storage status endpoint to trigger database initialization
        const response = await fetch('/api/storage/status');

        if (!response.ok) {
          console.warn('Database initialization check failed:', response.statusText);
          return;
        }

        const status = await response.json();
        console.log('Database initialized successfully:', status);
      } catch (error) {
        console.warn('Database initialization failed:', error);
        // Don't throw error - app should still work with file storage
      }
    };

    initializeDatabase();
  }, []);

  // This component doesn't render anything
  return null;
}
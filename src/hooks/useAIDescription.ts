import { useState, useCallback } from 'react';
import { generateDescription, StationData } from '@/services/aiDescriptionService';
import { toast } from 'sonner';
import { descriptionCache } from '@/services/descriptionCache';

export const useAIDescription = () => {
  const [description, setDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDescription = useCallback(async (station: StationData) => {
    // Check if there's already a cached description for this station
    const cachedDescription = descriptionCache.get(station);

    // If description was already in cache, just return it
    if (cachedDescription) {
      setDescription(cachedDescription);
      toast.success('Description loaded from cache!');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDescription(null);

    try {
      toast.info('Generating description...');
      const result = await generateDescription(station);
      setDescription(result);
      toast.success('Description generated!');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate description.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { description, isLoading, error, fetchDescription };
};
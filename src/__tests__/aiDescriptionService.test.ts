/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPost = vi.fn();
const mockIsCancel = vi.fn(() => false);

vi.mock('axios', () => ({
  default: {
    post: (...args: any[]) => mockPost(...args),
    isCancel: (...args: any[]) => mockIsCancel(...args),
  },
}));

const mockCache = {
  get: vi.fn(() => null),
  set: vi.fn(),
  has: vi.fn(() => false),
  getFallback: vi.fn((name: string) => `Mocked fallback for ${name}`),
};

vi.mock('@/services/descriptionCache', () => ({
  descriptionCache: mockCache as any,
  CachedDescription: {} as any,
}));

// Module under test
import { generateDescription, StationData } from '@/services/aiDescriptionService';

describe('aiDescriptionService', () => {
  const mockStation: StationData = { name: 'Radio Energy', country: 'US', genre: 'Dance' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('import.meta', { env: { VITE_OPENROUTER_API_KEY: 'test-key' } });
  });

  describe('Unit: caching', () => {
    it('returns cached description if available', async () => {
      mockCache.get.mockReturnValueOnce('"Radio Energy" — Great station!');
      const result = await generateDescription(mockStation);
      expect(result).toBe('"Radio Energy" — Great station!');
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('caches new descriptions on success', async () => {
      mockPost.mockResolvedValueOnce({
        data: { choices: [{ message: { content: 'An amazing station.' } }] },
      });
      await generateDescription(mockStation);
      expect(mockCache.set).toHaveBeenCalled();
    });
  });

  describe('Unit: API call flow', () => {
    it('calls OpenRouter API with correct model', async () => {
      mockPost.mockResolvedValueOnce({
        data: { choices: [{ message: { content: 'Beautiful music.' } }] },
      });
      await generateDescription(mockStation);
      const firstCall = mockPost.mock.calls[0];
      expect(firstCall[0]).toBe('https://openrouter.ai/api/v1/chat/completions');
      expect(firstCall[1].model).toBe('google/gemma-4-26b-a4b-it');
    });
  });

  describe('Unit: AbortSignal', () => {
    it('throws AbortError if signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();
      await expect(generateDescription(mockStation, controller.signal)).rejects
        .toThrow('Aborted');
    });

    it('throws AbortError if signal aborted mid-request', async () => {
      const controller = new AbortController();
      mockPost.mockImplementationOnce(async (_url: string, _opts: any) => {
        controller.abort();
        throw new DOMException('Aborted', 'AbortError');
      });
      await expect(generateDescription(mockStation, controller.signal)).rejects
        .toThrow();
    });
  });

  describe('Integration: model fallback chain', () => {
    it('tries fallback models if primary fails', async () => {
      const mockStations = [
        { data: { choices: [{ message: { content: 'First model ok.' } }] } },
      ];
      let callCount = 0;
      mockPost.mockImplementation(async () => {
        if (callCount === 0) {
          callCount++;
          throw new Error('Primary failed');
        }
        return mockStations[0];
      });
      mockCache.get.mockReturnValueOnce(null);
      mockCache.get.mockReturnValueOnce(null);
      await generateDescription(mockStation);
      expect(mockPost).toHaveBeenCalled();
    });
  });

  describe('Integration: error handling', () => {
    it('falls back to mock description on API failure', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network error'));
      mockCache.get.mockReturnValueOnce(null);
      const result = await generateDescription(mockStation);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('throws on 402 Payment Required', async () => {
      const err402 = new Error('Payment Required') as any;
      err402.response = { status: 402 };
      mockPost.mockRejectedValueOnce(err402);
      mockCache.get.mockReturnValueOnce(null);
      await expect(generateDescription(mockStation)).rejects.toThrow('Payment Required');
    });
  });

  describe('Cross-node: cache then API then cache', () => {
    it('stores API result in cache for subsequent calls', async () => {
      mockCache.get.mockReturnValueOnce(null);
      mockPost.mockResolvedValueOnce({
        data: { choices: [{ message: { content: 'Fresh API result.' } }] },
      });
      const first = await generateDescription(mockStation);
      expect(first).toContain('Fresh API result.');

      const cachedResult = `"${mockStation.name}" — Fresh API result.`;
      mockCache.get.mockReturnValueOnce(cachedResult);
      const second = await generateDescription(mockStation);
      expect(second).toBe(cachedResult);
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cross-node: abort cancels cache write', () => {
    it('does not cache if request is aborted', async () => {
      const controller = new AbortController();
      mockPost.mockImplementationOnce(async (_url: string, _opts: any) => {
        controller.abort();
        throw new DOMException('Aborted', 'AbortError');
      });
      mockCache.get.mockReturnValueOnce(null);
      await expect(generateDescription(mockStation, controller.signal)).rejects.toThrow();
      // Cache set should NOT have been called
      const setCalls = mockCache.set.mock.calls.filter(c => c[0].name === mockStation.name);
      expect(setCalls.length).toBe(0);
    });
  });
});

import { useState, useCallback, useRef } from 'react';
import { api, type GenerateVideoResponse } from '../services/api.js';

export interface GenerateResult {
  id: string;
  videoUrl: string;
  timeline: { label: string; width: string; color: string }[];
  createdAt: string;
}

export function useGenerate() {
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track last generation params for "regenerate"
  const lastPromptRef = useRef('');
  const lastRatioRef = useRef<'16:9' | '9:16' | '1:1' | '4:3'>('16:9');

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);

    lastPromptRef.current = prompt;
    lastRatioRef.current = selectedRatio;

    try {
      const res = await api.generateVideo({ prompt, ratio: selectedRatio });

      if (res.status === 'completed' && res.videoUrl && res.timeline) {
        setResult({
          id: res.id,
          videoUrl: res.videoUrl,
          timeline: res.timeline,
          createdAt: res.createdAt,
        });
      } else {
        setError('生成失败，请重试');
      }
    } catch (err) {
      setError((err as Error).message || '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedRatio]);

  const regenerate = useCallback(() => {
    setPrompt(lastPromptRef.current);
    setSelectedRatio(lastRatioRef.current);
    setResult(null);
    setError(null);
  }, []);

  const appendTag = useCallback((tag: string) => {
    setPrompt((prev) => (prev ? `${prev}，${tag}` : tag));
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    prompt,
    setPrompt,
    selectedRatio,
    setSelectedRatio,
    isGenerating,
    result,
    error,
    generate,
    regenerate,
    appendTag,
    clearResult,
  };
}

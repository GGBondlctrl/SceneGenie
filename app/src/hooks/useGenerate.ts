import { useState, useCallback, useRef } from 'react';
import { api } from '../services/api.js';
import { generateHTML, type LLMProvider } from '../services/llm.js';

export interface GenerateResult {
  id: string;
  videoUrl: string;
  createdAt: string;
}

type GeneratePhase = 'idle' | 'generating_html' | 'rendering_video' | 'completed' | 'error';

export function useGenerate() {
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3'>('16:9');
  const [phase, setPhase] = useState<GeneratePhase>('idle');
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(5);

  const lastPromptRef = useRef('');
  const lastRatioRef = useRef<'16:9' | '9:16' | '1:1' | '4:3'>('16:9');

  const getLLMConfig = useCallback(() => {
    const provider = localStorage.getItem('scene-genie-llm-provider') as LLMProvider | null;
    const apiKey = localStorage.getItem('scene-genie-llm-key');
    if (!provider || !apiKey) return null;
    const baseUrl = localStorage.getItem('scene-genie-llm-baseurl') || undefined;
    return { provider, apiKey, baseUrl };
  }, []);

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;

    const llmConfig = getLLMConfig();
    if (!llmConfig) {
      setError('请先在设置中配置 LLM API Key');
      setPhase('error');
      return;
    }

    setPhase('generating_html');
    setError(null);
    setResult(null);

    lastPromptRef.current = prompt;
    lastRatioRef.current = selectedRatio;

    let html: string;
    let dur: number;
    try {
      const res = await generateHTML(llmConfig, prompt, selectedRatio, duration);
      html = res.html;
      dur = res.duration;
      setDuration(dur);
    } catch (err) {
      setError('动画代码生成失败：' + (err as Error).message);
      setPhase('error');
      return;
    }

    setPhase('rendering_video');

    try {
      const res = await api.generateVideo({ html, ratio: selectedRatio, duration: dur });

      if (res.status === 'completed' && res.videoUrl) {
        setResult({
          id: res.id,
          videoUrl: res.videoUrl,
          createdAt: res.createdAt,
        });
        setPhase('completed');
      } else {
        setError('视频渲染失败，请重试');
        setPhase('error');
      }
    } catch (err) {
      setError((err as Error).message || '视频渲染失败，请重试');
      setPhase('error');
    }
  }, [prompt, selectedRatio, duration, getLLMConfig]);

  const regenerate = useCallback(() => {
    setPrompt(lastPromptRef.current);
    setSelectedRatio(lastRatioRef.current);
    setResult(null);
    setError(null);
    setPhase('idle');
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setPhase('idle');
  }, []);

  return {
    prompt,
    setPrompt,
    selectedRatio,
    setSelectedRatio,
    isGenerating: phase === 'generating_html' || phase === 'rendering_video',
    phase,
    result,
    error,
    duration,
    setDuration,
    generate,
    regenerate,
    clearResult,
  };
}

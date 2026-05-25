const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiUser {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export interface GenerateVideoRequest {
  prompt: string;
  ratio: '16:9' | '9:16' | '1:1' | '4:3';
}

export interface TimelineKeyframe {
  label: string;
  width: string;
  color: string;
}

export interface GenerateVideoResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  timeline?: TimelineKeyframe[];
  createdAt: string;
}

// MVP 阶段模拟数据
const mockTimeline: TimelineKeyframe[] = [
  { label: '0.0s', width: '15%', color: '#00B4FF' },
  { label: '0.5s', width: '10%', color: '#b724ff' },
  { label: '1.2s', width: '20%', color: '#3b82f6' },
  { label: '2.0s', width: '15%', color: '#00B4FF' },
  { label: '3.0s', width: '25%', color: '#f59e0b' },
  { label: '4.5s', width: '15%', color: '#b724ff' },
];

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('scene-genie-token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...((options?.headers as Record<string, string>) || {}),
    },
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    throw new ApiError(res.status, (data.error as string) || `HTTP ${res.status}`);
  }

  return data as T;
}

export const api = {
  sendCode: (email: string): Promise<{ message: string }> =>
    fetchJson('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  register: (email: string, password: string, name: string, code: string): Promise<AuthResponse> =>
    fetchJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, code }),
    }),

  login: (email: string, password: string): Promise<AuthResponse> =>
    fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: (): Promise<{ message: string }> =>
    fetchJson('/auth/logout', { method: 'POST' }),

  me: (): Promise<{ user: ApiUser }> =>
    fetchJson('/auth/me'),

  generateVideo: (_req: GenerateVideoRequest): Promise<GenerateVideoResponse> =>
    new Promise((resolve) => {
      const delay = 3000 + Math.random() * 2000; // 3-5s
      setTimeout(() => {
        resolve({
          id: `vid_${Date.now()}`,
          status: 'completed',
          videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4',
          timeline: mockTimeline,
          createdAt: new Date().toISOString(),
        });
      }, delay);
    }),
};

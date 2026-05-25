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
  html: string;
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

  generateVideo: (req: GenerateVideoRequest): Promise<GenerateVideoResponse> =>
    fetchJson('/video/generate', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
};

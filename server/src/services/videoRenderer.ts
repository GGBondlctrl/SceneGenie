import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, rm, mkdir } from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);

const TEMP_DIR = path.resolve(process.cwd(), 'temp');
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/videos');

const RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
};

export interface RenderOptions {
  html: string;
  ratio: string;
  taskId: string;
  duration: number;
}

export interface RenderResult {
  videoUrl: string;
  taskId: string;
}

export async function renderVideo({ html, ratio, taskId, duration }: RenderOptions): Promise<RenderResult> {
  const dims = RATIO_DIMENSIONS[ratio];
  if (!dims) {
    throw new Error(`Unsupported ratio: ${ratio}`);
  }

  // HyperFrames expects a directory with index.html
  const taskDir = path.join(TEMP_DIR, taskId);
  const htmlPath = path.join(taskDir, 'index.html');
  const outputPath = path.join(OUTPUT_DIR, `${taskId}.mp4`);

  await mkdir(taskDir, { recursive: true });
  await writeFile(htmlPath, html, 'utf-8');

  try {
    await execFileAsync(
      'npx',
      [
        'hyperframes',
        'render',
        taskDir,
        '-o',
        outputPath,
        '--width',
        String(dims.width),
        '--height',
        String(dims.height),
        '--duration',
        String(duration),
      ],
      { timeout: 120000, cwd: process.cwd(), shell: true }
    );

    return {
      videoUrl: `/videos/${taskId}.mp4`,
      taskId,
    };
  } finally {
    // Clean up temp directory
    try {
      await rm(taskDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

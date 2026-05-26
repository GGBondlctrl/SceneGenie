import { Router } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { renderVideo } from '../services/videoRenderer.js';

const router = Router();

router.post('/generate', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { html, ratio, duration } = req.body;

  if (!html || typeof html !== 'string') {
    res.status(400).json({ error: 'Missing or invalid html' });
    return;
  }

  if (!ratio || !['16:9', '9:16', '1:1', '4:3'].includes(ratio)) {
    res.status(400).json({ error: 'Missing or invalid ratio' });
    return;
  }

  if (!html.includes('<html') || !html.includes('</html>')) {
    res.status(400).json({ error: 'Invalid HTML content: missing <html> tags' });
    return;
  }

  const dur = typeof duration === 'number' && duration > 0 && duration <= 300 ? duration : 5;
  const taskId = `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const result = await renderVideo({ html, ratio, taskId, duration: dur });

    res.json({
      id: result.taskId,
      status: 'completed',
      videoUrl: result.videoUrl,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Video rendering failed:', err);
    res.status(500).json({ error: `Video rendering failed: ${errorMsg}` });
  }
});

export default router;

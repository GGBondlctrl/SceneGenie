import { Router } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { renderVideo } from '../services/videoRenderer.js';

const router = Router();

router.post('/generate', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { html, ratio } = req.body;

  if (!html || typeof html !== 'string') {
    res.status(400).json({ error: 'Missing or invalid html' });
    return;
  }

  if (!ratio || !['16:9', '9:16', '1:1', '4:3'].includes(ratio)) {
    res.status(400).json({ error: 'Missing or invalid ratio' });
    return;
  }

  if (!html.includes('<html>') || !html.includes('</html>')) {
    res.status(400).json({ error: 'Invalid HTML content' });
    return;
  }

  const taskId = `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const result = await renderVideo({ html, ratio, taskId });

    res.json({
      id: result.taskId,
      status: 'completed',
      videoUrl: result.videoUrl,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Video rendering failed:', err);
    res.status(500).json({ error: 'Video rendering failed' });
  }
});

export default router;

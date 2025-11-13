import { Router, Response } from 'express';
import { createSTTProvider, createTTSProvider } from '@ratu/voice';
import { asyncHandler } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

export function createVoiceRoutes(): Router {
  const router = Router({ mergeParams: true });

  /**
   * POST /api/v1/orgs/:orgId/voice/stt
   * Speech-to-text
   */
  router.post(
    '/stt',
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { orgId } = req.params;
      
      // In production, get audio from request body
      const audioBuffer = Buffer.from(req.body.audio || '', 'base64');

      const stt = createSTTProvider({
        provider: 'whisper',
        apiKey: process.env.OPENAI_API_KEY || '',
      });

      const result = await stt.transcribe(audioBuffer, {
        language: req.body.language,
      });

      res.json({
        text: result.text,
        language: result.language,
        confidence: result.confidence,
      });
    })
  );

  /**
   * POST /api/v1/orgs/:orgId/voice/tts
   * Text-to-speech
   */
  router.post(
    '/tts',
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { orgId } = req.params;
      const { text, voice = 'alloy', format = 'mp3' } = req.body;

      const tts = createTTSProvider({
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
      });

      const audioBuffer = await tts.synthesize(text, { voice, format });

      res.set('Content-Type', `audio/${format}`);
      res.send(audioBuffer);
    })
  );

  return router;
}
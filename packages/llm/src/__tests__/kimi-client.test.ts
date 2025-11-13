import { describe, it, expect, beforeEach } from '@jest/globals';
import { KimiK2Client } from '../kimi-client';

describe('KimiK2Client', () => {
  let client: KimiK2Client;

  beforeEach(() => {
    client = new KimiK2Client({
      apiKey: process.env.KIMI_K2_API_KEY || 'test-key',
      apiBase: process.env.KIMI_K2_API_BASE,
    });
  });

  describe('parseCitations', () => {
    it('should parse single citation', () => {
      const text = 'According to [CIT:doc1:0], the policy states...';
      const citations = client.parseCitations(text);

      expect(citations).toHaveLength(1);
      expect(citations[0]).toEqual({
        docId: 'doc1',
        chunkIx: 0,
      });
    });

    it('should parse multiple citations', () => {
      const text = 'Based on [CIT:doc1:0] and [CIT:doc2:5], we can conclude...';
      const citations = client.parseCitations(text);

      expect(citations).toHaveLength(2);
      expect(citations[0].docId).toBe('doc1');
      expect(citations[1].docId).toBe('doc2');
    });

    it('should handle no citations', () => {
      const text = 'This text has no citations.';
      const citations = client.parseCitations(text);

      expect(citations).toHaveLength(0);
    });

    it('should deduplicate citations', () => {
      const text = '[CIT:doc1:0] and [CIT:doc1:0] again';
      const citations = client.parseCitations(text);

      expect(citations).toHaveLength(1);
    });
  });

  describe('buildRatuSystemPrompt', () => {
    it('should build system prompt with context', () => {
      const context = 'Document 1: Test content';
      const prompt = KimiK2Client.buildRatuSystemPrompt('Test Org', context);

      expect(prompt).toContain('Test Org');
      expect(prompt).toContain(context);
      expect(prompt).toContain('[CIT:doc_id:chunk_ix]');
    });

    it('should handle empty context', () => {
      const prompt = KimiK2Client.buildRatuSystemPrompt('Test Org', '');

      expect(prompt).toContain('Test Org');
      expect(prompt).toContain('no relevant context');
    });
  });
});
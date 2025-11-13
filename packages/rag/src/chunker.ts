import { encoding_for_model } from 'tiktoken';

// =========================
// TEXT CHUNKING
// =========================

export interface ChunkOptions {
  targetTokens: number;
  overlap: number;
  preserveParagraphs?: boolean;
  minChunkSize?: number;
}

export interface Chunk {
  content: string;
  tokens: number;
  index: number;
  startChar: number;
  endChar: number;
}

export class Chunker {
  private encoder: any;

  constructor(model: string = 'gpt-3.5-turbo') {
    try {
      this.encoder = encoding_for_model(model as any);
    } catch {
      // Fallback to cl100k_base if model not found
      this.encoder = encoding_for_model('gpt-3.5-turbo' as any);
    }
  }

  /**
   * Count tokens in text
   */
  countTokens(text: string): number {
    try {
      const tokens = this.encoder.encode(text);
      return tokens.length;
    } catch (error) {
      // Fallback: rough estimate (1 token ≈ 4 characters)
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Chunk text into smaller pieces with overlap
   */
  chunk(text: string, options: ChunkOptions): Chunk[] {
    const {
      targetTokens = 800,
      overlap = 120,
      preserveParagraphs = true,
      minChunkSize = 100,
    } = options;

    // Normalize text
    const normalized = this.normalizeText(text);

    // Split into paragraphs if requested
    const segments = preserveParagraphs
      ? this.splitIntoParagraphs(normalized)
      : [normalized];

    const chunks: Chunk[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let chunkIndex = 0;
    let charPosition = 0;

    for (const segment of segments) {
      const segmentTokens = this.countTokens(segment);

      // If segment alone exceeds target, split it
      if (segmentTokens > targetTokens) {
        // Save current chunk if it exists
        if (currentChunk.trim()) {
          chunks.push({
            content: currentChunk.trim(),
            tokens: currentTokens,
            index: chunkIndex++,
            startChar: charPosition - currentChunk.length,
            endChar: charPosition,
          });
          currentChunk = '';
          currentTokens = 0;
        }

        // Split large segment
        const subChunks = this.splitLargeSegment(segment, targetTokens, overlap);
        for (const subChunk of subChunks) {
          chunks.push({
            content: subChunk,
            tokens: this.countTokens(subChunk),
            index: chunkIndex++,
            startChar: charPosition,
            endChar: charPosition + subChunk.length,
          });
          charPosition += subChunk.length;
        }
        continue;
      }

      // Check if adding segment would exceed target
      if (currentTokens + segmentTokens > targetTokens && currentChunk.trim()) {
        // Save current chunk
        chunks.push({
          content: currentChunk.trim(),
          tokens: currentTokens,
          index: chunkIndex++,
          startChar: charPosition - currentChunk.length,
          endChar: charPosition,
        });

        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, overlap);
        currentChunk = overlapText + '\n\n' + segment;
        currentTokens = this.countTokens(currentChunk);
      } else {
        // Add to current chunk
        currentChunk += (currentChunk ? '\n\n' : '') + segment;
        currentTokens = this.countTokens(currentChunk);
      }

      charPosition += segment.length;
    }

    // Add final chunk
    if (currentChunk.trim() && this.countTokens(currentChunk) >= minChunkSize) {
      chunks.push({
        content: currentChunk.trim(),
        tokens: currentTokens,
        index: chunkIndex,
        startChar: charPosition - currentChunk.length,
        endChar: charPosition,
      });
    }

    return chunks;
  }

  /**
   * Normalize text (remove extra whitespace, etc.)
   */
  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
      .replace(/[ \t]+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Split text into paragraphs
   */
  private splitIntoParagraphs(text: string): string[] {
    return text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  /**
   * Split a large segment that exceeds target tokens
   */
  private splitLargeSegment(text: string, targetTokens: number, overlap: number): string[] {
    const sentences = this.splitIntoSentences(text);
    const chunks: string[] = [];
    let currentChunk = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.countTokens(sentence);

      if (currentTokens + sentenceTokens > targetTokens && currentChunk) {
        chunks.push(currentChunk.trim());
        
        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, overlap);
        currentChunk = overlapText + ' ' + sentence;
        currentTokens = this.countTokens(currentChunk);
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentTokens = this.countTokens(currentChunk);
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting (can be improved with NLP library)
    return text
      .split(/([.!?]+\s+)/)
      .reduce((acc: string[], part, i, arr) => {
        if (i % 2 === 0 && part.trim()) {
          const sentence = part + (arr[i + 1] || '');
          acc.push(sentence.trim());
        }
        return acc;
      }, [])
      .filter(s => s.length > 0);
  }

  /**
   * Get overlap text from end of chunk
   */
  private getOverlapText(text: string, overlapTokens: number): string {
    const sentences = this.splitIntoSentences(text);
    let overlap = '';
    let tokens = 0;

    // Take sentences from the end until we reach overlap target
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i];
      const sentenceTokens = this.countTokens(sentence);

      if (tokens + sentenceTokens > overlapTokens) {
        break;
      }

      overlap = sentence + ' ' + overlap;
      tokens += sentenceTokens;
    }

    return overlap.trim();
  }

  /**
   * Free encoder resources
   */
  free(): void {
    if (this.encoder && typeof this.encoder.free === 'function') {
      this.encoder.free();
    }
  }
}

// =========================
// FACTORY FUNCTION
// =========================

export function createChunker(model?: string): Chunker {
  return new Chunker(model);
}
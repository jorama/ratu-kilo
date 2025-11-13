import crypto from 'crypto';

// =========================
// DIFF ENGINE
// =========================

export interface DocumentSnapshot {
  id: string;
  uri: string;
  checksum: string;
  content: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface DiffResult {
  type: 'new' | 'updated' | 'removed' | 'unchanged';
  docId: string;
  uri: string;
  changes?: {
    contentChanged: boolean;
    metadataChanged: boolean;
    checksumOld?: string;
    checksumNew?: string;
    addedChars?: number;
    removedChars?: number;
    similarity?: number;
  };
  timestamp: Date;
}

export class DiffEngine {
  /**
   * Compare two document snapshots
   */
  compare(oldDoc: DocumentSnapshot | null, newDoc: DocumentSnapshot | null): DiffResult {
    const timestamp = new Date();

    // New document
    if (!oldDoc && newDoc) {
      return {
        type: 'new',
        docId: newDoc.id,
        uri: newDoc.uri,
        timestamp,
      };
    }

    // Removed document
    if (oldDoc && !newDoc) {
      return {
        type: 'removed',
        docId: oldDoc.id,
        uri: oldDoc.uri,
        timestamp,
      };
    }

    // Both exist - check for changes
    if (oldDoc && newDoc) {
      const contentChanged = oldDoc.checksum !== newDoc.checksum;
      const metadataChanged = this.hasMetadataChanged(oldDoc.metadata, newDoc.metadata);

      if (!contentChanged && !metadataChanged) {
        return {
          type: 'unchanged',
          docId: newDoc.id,
          uri: newDoc.uri,
          timestamp,
        };
      }

      return {
        type: 'updated',
        docId: newDoc.id,
        uri: newDoc.uri,
        changes: {
          contentChanged,
          metadataChanged,
          checksumOld: oldDoc.checksum,
          checksumNew: newDoc.checksum,
          addedChars: Math.max(0, newDoc.content.length - oldDoc.content.length),
          removedChars: Math.max(0, oldDoc.content.length - newDoc.content.length),
          similarity: this.calculateSimilarity(oldDoc.content, newDoc.content),
        },
        timestamp,
      };
    }

    // Should never reach here
    throw new Error('Invalid comparison state');
  }

  /**
   * Batch compare documents
   */
  compareBatch(
    oldDocs: Map<string, DocumentSnapshot>,
    newDocs: Map<string, DocumentSnapshot>
  ): DiffResult[] {
    const results: DiffResult[] = [];
    const processedUris = new Set<string>();

    // Check for new and updated documents
    for (const [uri, newDoc] of newDocs) {
      const oldDoc = oldDocs.get(uri);
      results.push(this.compare(oldDoc || null, newDoc));
      processedUris.add(uri);
    }

    // Check for removed documents
    for (const [uri, oldDoc] of oldDocs) {
      if (!processedUris.has(uri)) {
        results.push(this.compare(oldDoc, null));
      }
    }

    return results;
  }

  /**
   * Calculate checksum for content
   */
  calculateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check if metadata has changed
   */
  private hasMetadataChanged(oldMeta: Record<string, any>, newMeta: Record<string, any>): boolean {
    const oldKeys = Object.keys(oldMeta).sort();
    const newKeys = Object.keys(newMeta).sort();

    if (oldKeys.length !== newKeys.length) {
      return true;
    }

    for (let i = 0; i < oldKeys.length; i++) {
      if (oldKeys[i] !== newKeys[i]) {
        return true;
      }

      const key = oldKeys[i];
      if (JSON.stringify(oldMeta[key]) !== JSON.stringify(newMeta[key])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate similarity between two texts (0-1)
   * Using simple character-based similarity
   */
  private calculateSimilarity(text1: string, text2: string): number {
    if (text1 === text2) return 1.0;
    if (!text1 || !text2) return 0.0;

    const len1 = text1.length;
    const len2 = text2.length;
    const maxLen = Math.max(len1, len2);

    if (maxLen === 0) return 1.0;

    // Count matching characters
    let matches = 0;
    const minLen = Math.min(len1, len2);

    for (let i = 0; i < minLen; i++) {
      if (text1[i] === text2[i]) {
        matches++;
      }
    }

    return matches / maxLen;
  }

  /**
   * Generate diff summary
   */
  generateSummary(results: DiffResult[]): {
    new: number;
    updated: number;
    removed: number;
    unchanged: number;
    total: number;
  } {
    const summary = {
      new: 0,
      updated: 0,
      removed: 0,
      unchanged: 0,
      total: results.length,
    };

    for (const result of results) {
      summary[result.type]++;
    }

    return summary;
  }

  /**
   * Filter results by type
   */
  filterByType(results: DiffResult[], type: DiffResult['type']): DiffResult[] {
    return results.filter(r => r.type === type);
  }

  /**
   * Get significant changes (exclude unchanged)
   */
  getSignificantChanges(results: DiffResult[]): DiffResult[] {
    return results.filter(r => r.type !== 'unchanged');
  }
}

// =========================
// FACTORY FUNCTION
// =========================

export function createDiffEngine(): DiffEngine {
  return new DiffEngine();
}
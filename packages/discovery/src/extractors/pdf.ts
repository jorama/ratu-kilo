import pdfParse from 'pdf-parse';
import axios from 'axios';

// =========================
// PDF EXTRACTOR
// =========================

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
}

export interface ExtractedPDF {
  text: string;
  metadata: PDFMetadata;
  pages: Array<{
    pageNumber: number;
    text: string;
  }>;
}

export class PDFExtractor {
  /**
   * Extract text and metadata from PDF buffer
   */
  async extract(buffer: Buffer): Promise<ExtractedPDF> {
    try {
      const data = await pdfParse(buffer);

      return {
        text: data.text,
        metadata: {
          title: data.info?.Title,
          author: data.info?.Author,
          subject: data.info?.Subject,
          creator: data.info?.Creator,
          producer: data.info?.Producer,
          creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
          modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined,
          pageCount: data.numpages,
        },
        pages: this.extractPages(data.text, data.numpages),
      };
    } catch (error: any) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract PDF from URL
   */
  async extractFromUrl(url: string): Promise<ExtractedPDF> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
      });

      const buffer = Buffer.from(response.data);
      return await this.extract(buffer);
    } catch (error: any) {
      throw new Error(`Failed to download PDF from ${url}: ${error.message}`);
    }
  }

  /**
   * Split text into pages (approximate)
   */
  private extractPages(text: string, pageCount: number): Array<{ pageNumber: number; text: string }> {
    // This is a simple approximation since pdf-parse doesn't provide page-by-page text
    const avgCharsPerPage = Math.ceil(text.length / pageCount);
    const pages: Array<{ pageNumber: number; text: string }> = [];

    for (let i = 0; i < pageCount; i++) {
      const start = i * avgCharsPerPage;
      const end = Math.min((i + 1) * avgCharsPerPage, text.length);
      pages.push({
        pageNumber: i + 1,
        text: text.substring(start, end),
      });
    }

    return pages;
  }

  /**
   * Check if buffer is a valid PDF
   */
  isPDF(buffer: Buffer): boolean {
    // PDF files start with %PDF-
    return buffer.length > 4 && buffer.toString('utf8', 0, 5) === '%PDF-';
  }
}

// =========================
// FACTORY FUNCTION
// =========================

export function createPDFExtractor(): PDFExtractor {
  return new PDFExtractor();
}
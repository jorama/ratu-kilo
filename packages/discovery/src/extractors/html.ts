import * as cheerio from 'cheerio';

// =========================
// HTML EXTRACTOR
// =========================

export interface ExtractedHTML {
  title: string;
  content: string;
  metadata: {
    description?: string;
    keywords?: string[];
    author?: string;
    language?: string;
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  headings: Array<{
    level: number;
    text: string;
  }>;
  links: Array<{
    href: string;
    text: string;
    rel?: string;
  }>;
  images: Array<{
    src: string;
    alt?: string;
    title?: string;
  }>;
}

export class HTMLExtractor {
  /**
   * Extract content and metadata from HTML
   */
  extract(html: string, baseUrl?: string): ExtractedHTML {
    const $ = cheerio.load(html);

    return {
      title: this.extractTitle($),
      content: this.extractContent($),
      metadata: this.extractMetadata($),
      headings: this.extractHeadings($),
      links: this.extractLinks($, baseUrl),
      images: this.extractImages($, baseUrl),
    };
  }

  /**
   * Extract title
   */
  private extractTitle($: cheerio.CheerioAPI): string {
    // Try multiple sources
    const sources = [
      $('title').text(),
      $('meta[property="og:title"]').attr('content'),
      $('meta[name="twitter:title"]').attr('content'),
      $('h1').first().text(),
    ];

    for (const source of sources) {
      if (source && source.trim()) {
        return source.trim();
      }
    }

    return 'Untitled';
  }

  /**
   * Extract main content
   */
  private extractContent($: cheerio.CheerioAPI): string {
    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, .advertisement, .ads').remove();

    // Try to find main content area
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '#content',
      '.post-content',
      '.entry-content',
      '.article-content',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        return this.cleanText(element.text());
      }
    }

    // Fallback to body
    return this.cleanText($('body').text());
  }

  /**
   * Extract metadata
   */
  private extractMetadata($: cheerio.CheerioAPI): ExtractedHTML['metadata'] {
    return {
      description: $('meta[name="description"]').attr('content') || 
                   $('meta[property="og:description"]').attr('content'),
      keywords: $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()),
      author: $('meta[name="author"]').attr('content'),
      language: $('html').attr('lang') || $('meta[http-equiv="content-language"]').attr('content'),
      canonical: $('link[rel="canonical"]').attr('href'),
      ogTitle: $('meta[property="og:title"]').attr('content'),
      ogDescription: $('meta[property="og:description"]').attr('content'),
      ogImage: $('meta[property="og:image"]').attr('content'),
    };
  }

  /**
   * Extract headings
   */
  private extractHeadings($: cheerio.CheerioAPI): Array<{ level: number; text: string }> {
    const headings: Array<{ level: number; text: string }> = [];

    $('h1, h2, h3, h4, h5, h6').each((_: any, element: any) => {
      const $el = $(element);
      const level = parseInt($el.prop('tagName').substring(1));
      const text = this.cleanText($el.text());

      if (text) {
        headings.push({ level, text });
      }
    });

    return headings;
  }

  /**
   * Extract links
   */
  private extractLinks($: cheerio.CheerioAPI, baseUrl?: string): Array<{ href: string; text: string; rel?: string }> {
    const links: Array<{ href: string; text: string; rel?: string }> = [];

    $('a[href]').each((_: any, element: any) => {
      const $el = $(element);
      let href = $el.attr('href');
      
      if (!href) return;

      // Resolve relative URLs if baseUrl provided
      if (baseUrl && !href.startsWith('http')) {
        try {
          href = new URL(href, baseUrl).href;
        } catch {
          return; // Invalid URL
        }
      }

      links.push({
        href,
        text: this.cleanText($el.text()),
        rel: $el.attr('rel'),
      });
    });

    return links;
  }

  /**
   * Extract images
   */
  private extractImages($: cheerio.CheerioAPI, baseUrl?: string): Array<{ src: string; alt?: string; title?: string }> {
    const images: Array<{ src: string; alt?: string; title?: string }> = [];

    $('img[src]').each((_: any, element: any) => {
      const $el = $(element);
      let src = $el.attr('src');

      if (!src) return;

      // Resolve relative URLs if baseUrl provided
      if (baseUrl && !src.startsWith('http') && !src.startsWith('data:')) {
        try {
          src = new URL(src, baseUrl).href;
        } catch {
          return; // Invalid URL
        }
      }

      images.push({
        src,
        alt: $el.attr('alt'),
        title: $el.attr('title'),
      });
    });

    return images;
  }

  /**
   * Clean text (remove extra whitespace)
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  /**
   * Extract structured data (JSON-LD, microdata)
   */
  extractStructuredData($: cheerio.CheerioAPI): any[] {
    const data: any[] = [];

    // Extract JSON-LD
    $('script[type="application/ld+json"]').each((_: any, element: any) => {
      try {
        const json = JSON.parse($(element).html() || '{}');
        data.push(json);
      } catch {
        // Invalid JSON, skip
      }
    });

    return data;
  }
}

// =========================
// FACTORY FUNCTION
// =========================

export function createHTMLExtractor(): HTMLExtractor {
  return new HTMLExtractor();
}
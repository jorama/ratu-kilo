import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import { URL } from 'url';
import crypto from 'crypto';

// =========================
// CRAWLER TYPES
// =========================

export interface CrawlConfig {
  orgId: string;
  sourceId: string;
  startUrl: string;
  maxDepth?: number;
  maxPages?: number;
  allowedDomains?: string[];
  excludePatterns?: string[];
  respectRobotsTxt?: boolean;
  userAgent?: string;
  rateLimit?: number; // ms between requests
  timeout?: number;
}

export interface CrawlResult {
  url: string;
  title: string;
  content: string;
  html: string;
  links: string[];
  metadata: {
    statusCode: number;
    contentType: string;
    lastModified?: string;
    etag?: string;
    checksum: string;
  };
  depth: number;
  timestamp: Date;
}

export interface CrawlStats {
  pagesVisited: number;
  pagesFailed: number;
  totalBytes: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

// =========================
// WEB CRAWLER
// =========================

export class WebCrawler {
  private config: Required<CrawlConfig>;
  private client: AxiosInstance;
  private visited: Set<string> = new Set();
  private queue: Array<{ url: string; depth: number }> = [];
  private robots: Map<string, any> = new Map();
  private stats: CrawlStats;

  constructor(config: CrawlConfig) {
    this.config = {
      maxDepth: 3,
      maxPages: 100,
      allowedDomains: [],
      excludePatterns: [],
      respectRobotsTxt: true,
      userAgent: 'RatuBot/1.0 (+https://ratu.ai/bot)',
      rateLimit: 1000,
      timeout: 30000,
      ...config,
    };

    this.client = axios.create({
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
      },
      maxRedirects: 5,
    });

    this.stats = {
      pagesVisited: 0,
      pagesFailed: 0,
      totalBytes: 0,
      startTime: new Date(),
    };
  }

  /**
   * Start crawling from the configured URL
   */
  async crawl(
    onPage?: (result: CrawlResult) => Promise<void>
  ): Promise<CrawlStats> {
    this.stats.startTime = new Date();
    this.queue.push({ url: this.config.startUrl, depth: 0 });

    while (this.queue.length > 0 && this.stats.pagesVisited < this.config.maxPages) {
      const { url, depth } = this.queue.shift()!;

      if (this.visited.has(url) || depth > this.config.maxDepth) {
        continue;
      }

      try {
        // Check robots.txt
        if (this.config.respectRobotsTxt && !(await this.isAllowedByRobots(url))) {
          console.log(`Blocked by robots.txt: ${url}`);
          continue;
        }

        // Crawl the page
        const result = await this.crawlPage(url, depth);
        this.visited.add(url);
        this.stats.pagesVisited++;
        this.stats.totalBytes += result.html.length;

        // Call callback if provided
        if (onPage) {
          await onPage(result);
        }

        // Add links to queue
        for (const link of result.links) {
          if (!this.visited.has(link) && this.shouldCrawl(link)) {
            this.queue.push({ url: link, depth: depth + 1 });
          }
        }

        // Rate limiting
        if (this.config.rateLimit > 0) {
          await this.sleep(this.config.rateLimit);
        }
      } catch (error: any) {
        console.error(`Failed to crawl ${url}:`, error.message);
        this.stats.pagesFailed++;
      }
    }

    this.stats.endTime = new Date();
    this.stats.duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();

    return this.stats;
  }

  /**
   * Crawl a single page
   */
  private async crawlPage(url: string, depth: number): Promise<CrawlResult> {
    const response = await this.client.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract title
    const title = $('title').text().trim() || url;

    // Extract main content
    const content = this.extractContent($);

    // Extract links
    const links = this.extractLinks($, url);

    // Calculate checksum
    const checksum = crypto.createHash('sha256').update(html).digest('hex');

    return {
      url,
      title,
      content,
      html,
      links,
      metadata: {
        statusCode: response.status,
        contentType: response.headers['content-type'] || 'text/html',
        lastModified: response.headers['last-modified'],
        etag: response.headers['etag'],
        checksum,
      },
      depth,
      timestamp: new Date(),
    };
  }

  /**
   * Extract text content from HTML
   */
  private extractContent($: cheerio.CheerioAPI): string {
    // Remove script and style tags
    $('script, style, nav, footer, header, aside').remove();

    // Try to find main content
    let content = '';
    const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content'];

    for (const selector of mainSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // Fallback to body
    if (!content) {
      content = $('body').text();
    }

    // Clean up whitespace
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  /**
   * Extract links from page
   */
  private extractLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const links: string[] = [];
    const base = new URL(baseUrl);

    $('a[href]').each((_, element) => {
      try {
        const href = $(element).attr('href');
        if (!href) return;

        // Resolve relative URLs
        const absolute = new URL(href, baseUrl).href;

        // Only include HTTP(S) links
        if (absolute.startsWith('http://') || absolute.startsWith('https://')) {
          links.push(absolute);
        }
      } catch (error) {
        // Invalid URL, skip
      }
    });

    return [...new Set(links)]; // Deduplicate
  }

  /**
   * Check if URL should be crawled
   */
  private shouldCrawl(url: string): boolean {
    try {
      const parsed = new URL(url);

      // Check allowed domains
      if (this.config.allowedDomains.length > 0) {
        const allowed = this.config.allowedDomains.some(domain =>
          parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
        );
        if (!allowed) return false;
      }

      // Check exclude patterns
      for (const pattern of this.config.excludePatterns) {
        if (url.includes(pattern)) {
          return false;
        }
      }

      // Exclude common non-content URLs
      const excludeExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.exe'];
      if (excludeExtensions.some(ext => url.toLowerCase().endsWith(ext))) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check robots.txt
   */
  private async isAllowedByRobots(url: string): Promise<boolean> {
    try {
      const parsed = new URL(url);
      const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;

      // Check cache
      if (!this.robots.has(robotsUrl)) {
        try {
          const response = await this.client.get(robotsUrl);
          const robots = robotsParser(robotsUrl, response.data);
          this.robots.set(robotsUrl, robots);
        } catch (error) {
          // No robots.txt or error fetching it, allow by default
          this.robots.set(robotsUrl, null);
        }
      }

      const robots = this.robots.get(robotsUrl);
      if (!robots) return true;

      return robots.isAllowed(url, this.config.userAgent);
    } catch (error) {
      return true; // Allow on error
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get crawl statistics
   */
  getStats(): CrawlStats {
    return { ...this.stats };
  }

  /**
   * Reset crawler state
   */
  reset(): void {
    this.visited.clear();
    this.queue = [];
    this.robots.clear();
    this.stats = {
      pagesVisited: 0,
      pagesFailed: 0,
      totalBytes: 0,
      startTime: new Date(),
    };
  }
}

// =========================
// SITEMAP PARSER
// =========================

export class SitemapParser {
  private client: AxiosInstance;

  constructor(userAgent: string = 'RatuBot/1.0') {
    this.client = axios.create({
      headers: {
        'User-Agent': userAgent,
      },
      timeout: 30000,
    });
  }

  /**
   * Parse sitemap and return URLs
   */
  async parse(sitemapUrl: string): Promise<string[]> {
    try {
      const response = await this.client.get(sitemapUrl);
      const $ = cheerio.load(response.data, { xmlMode: true });

      const urls: string[] = [];

      // Parse sitemap index
      $('sitemap > loc').each((_, element) => {
        urls.push($(element).text());
      });

      // Parse URL set
      $('url > loc').each((_, element) => {
        urls.push($(element).text());
      });

      return urls;
    } catch (error: any) {
      throw new Error(`Failed to parse sitemap: ${error.message}`);
    }
  }

  /**
   * Discover sitemap from robots.txt
   */
  async discoverFromRobots(baseUrl: string): Promise<string[]> {
    try {
      const robotsUrl = new URL('/robots.txt', baseUrl).href;
      const response = await this.client.get(robotsUrl);
      const lines = response.data.split('\n');

      const sitemaps: string[] = [];
      for (const line of lines) {
        const match = line.match(/^Sitemap:\s*(.+)$/i);
        if (match) {
          sitemaps.push(match[1].trim());
        }
      }

      return sitemaps;
    } catch (error) {
      return [];
    }
  }
}

// =========================
// FACTORY FUNCTIONS
// =========================

export function createCrawler(config: CrawlConfig): WebCrawler {
  return new WebCrawler(config);
}

export function createSitemapParser(userAgent?: string): SitemapParser {
  return new SitemapParser(userAgent);
}
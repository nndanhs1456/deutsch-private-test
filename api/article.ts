import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';

export interface ArticleFallbackMeta {
  title?: string;
  pubDate?: string;
  sourceLabel?: string;
  level?: string;
  image?: string;
  summary?: string;
  fullTextParagraphs?: string[];
}

export interface ExtractedArticleResult {
  title: string;
  url: string;
  pubDate: string;
  sourceLabel: string;
  level: string;
  image: string;
  paragraphs: string[];
  blocked: boolean;
}

const NOISE_PHRASES = [
  'cookie',
  'datenschutz',
  'javascript',
  'nutzungsbedingungen',
  'impressum',
  'alle rechte vorbehalten',
  'jetzt teilen',
  'auf facebook teilen',
  'auf x teilen',
  'per e-mail versenden',
  'diese seite drucken',
];

function isNoiseParagraph(text: string): boolean {
  if (!text || text.length < 25) return true;
  const lower = text.toLowerCase();
  if (text.length < 90 && NOISE_PHRASES.some((p) => lower.includes(p))) {
    return true;
  }
  return false;
}

function extractParagraphsFromHtmlFragment(html: string): string[] {
  if (!html) return [];
  const $ = cheerio.load(html);
  const out: string[] = [];
  $('p, h2, h3, blockquote').each((_, el) => {
    const txt = $(el).text().replace(/\s+/g, ' ').trim();
    if (!isNoiseParagraph(txt) && !out.includes(txt)) {
      out.push(txt);
    }
  });
  return out;
}

function extractJsonLdArticleBody($: cheerio.CheerioAPI): string[] {
  const out: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).contents().text().trim();
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : parsed?.['@graph'] || [parsed];
      for (const node of nodes) {
        if (node && typeof node.articleBody === 'string' && node.articleBody.length > 150) {
          const split = node.articleBody
            .split(/\n{2,}|\r\n\r\n/)
            .map((s: string) => s.replace(/\s+/g, ' ').trim())
            .filter((s: string) => !isNoiseParagraph(s));
          for (const p of split) {
            if (!out.includes(p)) out.push(p);
          }
        }
      }
    } catch {
      // ignore invalid JSON-LD
    }
  });
  return out;
}

export async function extractFullArticleContent(
  url: string,
  cached?: ArticleFallbackMeta
): Promise<ExtractedArticleResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const jsonLdParagraphs = extractJsonLdArticleBody($);

    const rawTitle =
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('h1').first().text().replace(/\s+/g, ' ').trim() ||
      cached?.title ||
      'Artikel';

    const image =
      $('meta[property="og:image"]').attr('content')?.trim() ||
      $('article img').first().attr('src')?.trim() ||
      cached?.image ||
      '';

    const pubDate =
      $('meta[property="article:published_time"]').attr('content')?.slice(0, 10) ||
      $('time').first().text().replace(/\s+/g, ' ').trim() ||
      cached?.pubDate ||
      'Hôm nay';

    // 1) @mozilla/readability + jsdom extraction
    let readabilityParagraphs: string[] = [];
    let readabilityTitle = '';
    try {
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const parsed = reader.parse();
      if (parsed) {
        readabilityTitle = (parsed.title || '').trim();
        if (parsed.content) {
          readabilityParagraphs = extractParagraphsFromHtmlFragment(parsed.content);
        }
        if (readabilityParagraphs.length === 0 && parsed.textContent) {
          readabilityParagraphs = parsed.textContent
            .split(/\n+/)
            .map((s) => s.replace(/\s+/g, ' ').trim())
            .filter((s) => !isNoiseParagraph(s));
        }
      }
      dom.window.close();
    } catch {
      // ignore readability error and rely on cheerio selectors
    }

    // 2) Cheerio main-content selectors (Tagesschau .textabsatz, DW .rich-text, Nachrichtenleicht, generic article/main)
    const $clean = cheerio.load(html);
    $clean(
      'script, style, nav, footer, header, aside, form, figure figcaption, .shariff, .social, .meta-box, .teaser, .related-content, .advertisement'
    ).remove();

    const selectorGroups = [
      'article p.textabsatz, .copytext p, .m-ten p.textabsatz',
      '.article-content p, .rich-text p, .long-text p',
      '.b-article-body p, .article-details-text p',
      'article p',
      'main p',
      '.content p',
    ];

    let bestCheerioParagraphs: string[] = [];
    for (const sel of selectorGroups) {
      const candidate: string[] = [];
      $clean(sel).each((_, el) => {
        const text = $clean(el).text().replace(/\s+/g, ' ').trim();
        if (!isNoiseParagraph(text) && !candidate.includes(text)) {
          candidate.push(text);
        }
      });
      const candidateChars = candidate.join(' ').length;
      const bestChars = bestCheerioParagraphs.join(' ').length;
      if (candidateChars > bestChars) {
        bestCheerioParagraphs = candidate;
      }
    }

    // Choose whichever extraction captured the richest full-text body
    const candidates = [readabilityParagraphs, bestCheerioParagraphs, jsonLdParagraphs];
    let bestParagraphs: string[] = [];
    for (const cand of candidates) {
      if (cand.join(' ').length > bestParagraphs.join(' ').length) {
        bestParagraphs = cand;
      }
    }

    const totalExtractedChars = bestParagraphs.join(' ').length;
    const isBlocked = bestParagraphs.length === 0 || totalExtractedChars < 120;

    if (isBlocked && cached?.fullTextParagraphs?.length) {
      bestParagraphs = cached.fullTextParagraphs;
    } else if (isBlocked && cached?.summary) {
      bestParagraphs = [cached.summary];
    }

    return {
      title: readabilityTitle || rawTitle,
      url,
      pubDate,
      sourceLabel: cached?.sourceLabel || 'Deutsche Presse',
      level: cached?.level || 'B1/B2',
      image,
      paragraphs: bestParagraphs,
      blocked: isBlocked,
    };
  } catch (err) {
    if (cached) {
      return {
        title: cached.title || 'Artikel',
        url,
        pubDate: cached.pubDate || '',
        sourceLabel: cached.sourceLabel || 'Deutsche Presse',
        level: cached.level || 'B1/B2',
        image: cached.image || '',
        paragraphs:
          cached.fullTextParagraphs && cached.fullTextParagraphs.length > 0
            ? cached.fullTextParagraphs
            : cached.summary
            ? [cached.summary]
            : [],
        blocked: true,
      };
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawUrl = String(req.query?.url || '').trim();
  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
    return res.status(400).json({ error: 'URL bài báo không hợp lệ.' });
  }

  try {
    const article = await extractFullArticleContent(rawUrl);
    return res.status(200).json(article);
  } catch (error: any) {
    return res.status(502).json({
      error: error?.message || 'Không thể trích xuất nội dung bài báo.',
      blocked: true,
      paragraphs: [],
    });
  }
}

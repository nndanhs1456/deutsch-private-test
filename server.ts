import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to parse ISO 8601 duration (e.g. PT2H59M21S -> "2:59:21" & seconds)
function parseIsoDuration(iso: string): { text: string; seconds: number } {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { text: '0:00', seconds: 0 };
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  if (hours > 0) {
    return {
      text: `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      seconds: totalSeconds,
    };
  }
  return {
    text: `${minutes}:${String(seconds).padStart(2, '0')}`,
    seconds: totalSeconds,
  };
}

function parseDurationTextToSeconds(text: string): number {
  if (!text) return 0;
  const parts = text.split(':').map((p) => parseInt(p.trim(), 10) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function extractPlaylistId(input: string): string {
  const trimmed = (input || '').trim();
  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return trimmed;
}

async function fetchViaYouTubeDataApi(playlistId: string, apiKey: string) {
  const plUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${encodeURIComponent(
    playlistId
  )}&key=${encodeURIComponent(apiKey)}`;
  const plRes = await fetch(plUrl);
  if (!plRes.ok) {
    throw new Error(`YouTube Data API playlists error: ${plRes.status}`);
  }
  const plData: any = await plRes.json();
  const playlistTitle = plData?.items?.[0]?.snippet?.title || 'YouTube Playlist';
  const playlistDescription =
    plData?.items?.[0]?.snippet?.description || 'Tự động đồng bộ từ YouTube Playlist';

  const items: any[] = [];
  let nextPageToken = '';

  do {
    const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${encodeURIComponent(
      playlistId
    )}&key=${encodeURIComponent(apiKey)}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    const itemsRes = await fetch(itemsUrl);
    if (!itemsRes.ok) break;
    const itemsData: any = await itemsRes.json();
    if (Array.isArray(itemsData.items)) {
      items.push(...itemsData.items);
    }
    nextPageToken = itemsData.nextPageToken || '';
  } while (nextPageToken && items.length < 200);

  const videoIds = items
    .map((it) => it?.contentDetails?.videoId || it?.snippet?.resourceId?.videoId)
    .filter(Boolean);

  const durationsMap: Record<string, { text: string; seconds: number }> = {};
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const vUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(
      ','
    )}&key=${encodeURIComponent(apiKey)}`;
    const vRes = await fetch(vUrl);
    if (vRes.ok) {
      const vData: any = await vRes.json();
      for (const v of vData.items || []) {
        durationsMap[v.id] = parseIsoDuration(v?.contentDetails?.duration || '');
      }
    }
  }

  const tracks = items
    .map((it, idx) => {
      const videoId = it?.contentDetails?.videoId || it?.snippet?.resourceId?.videoId;
      const title = it?.snippet?.title || '';
      if (!videoId || title === 'Private video' || title === 'Deleted video') return null;
      const dur = durationsMap[videoId] || { text: '0:00', seconds: 0 };
      return {
        index: idx + 1,
        videoId,
        title,
        channel: it?.snippet?.videoOwnerChannelTitle || it?.snippet?.channelTitle || 'YouTube',
        thumbnail:
          it?.snippet?.thumbnails?.medium?.url ||
          it?.snippet?.thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        durationText: dur.text,
        durationSeconds: dur.seconds,
      };
    })
    .filter(Boolean);

  return {
    playlistId,
    title: playlistTitle,
    description: playlistDescription,
    source: 'youtube_data_api_v3',
    tracks,
  };
}

async function fetchViaPublicYouTubePage(playlistId: string) {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+417',
  };

  const r1 = await fetch(
    `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`,
    { headers }
  );
  const html1 = await r1.text();
  const m1 = html1.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!m1) {
    throw new Error('Không thể đọc dữ liệu playlist từ YouTube.');
  }

  const d1 = JSON.parse(m1[1]);
  let playlistTitle =
    d1?.metadata?.playlistMetadataRenderer?.title ||
    d1?.header?.playlistHeaderRenderer?.title?.simpleText ||
    d1?.microformat?.microformatDataRenderer?.title ||
    'YouTube Playlist';
  const playlistDescription =
    d1?.metadata?.playlistMetadataRenderer?.description ||
    d1?.microformat?.microformatDataRenderer?.description ||
    'Tự động cập nhật danh sách bài từ YouTube Playlist';

  const tracks: any[] = [];

  function walkPlaylistVideos(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.playlistVideoRenderer) {
      const v = obj.playlistVideoRenderer;
      const videoId = v.videoId;
      const title = v.title?.runs?.[0]?.text || v.title?.simpleText || '';
      if (videoId && title && title !== 'Private video' && title !== 'Deleted video') {
        const durationText = v.lengthText?.simpleText || '0:00';
        tracks.push({
          index: tracks.length + 1,
          videoId,
          title,
          channel: v.shortBylineText?.runs?.[0]?.text || 'YouTube',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          durationText,
          durationSeconds:
            parseInt(v.lengthSeconds || '0', 10) || parseDurationTextToSeconds(durationText),
        });
      }
      return;
    }
    for (const k of Object.keys(obj)) {
      walkPlaylistVideos(obj[k]);
    }
  }
  walkPlaylistVideos(d1);

  if (tracks.length === 0) {
    const thumbUrl =
      d1?.microformat?.microformatDataRenderer?.thumbnail?.thumbnails?.[0]?.url || '';
    const firstVideoIdMatch = thumbUrl.match(/\/vi\/([^/]+)\//);
    const firstVideoId = firstVideoIdMatch ? firstVideoIdMatch[1] : '';

    if (firstVideoId) {
      const r2 = await fetch(
        `https://www.youtube.com/watch?v=${encodeURIComponent(
          firstVideoId
        )}&list=${encodeURIComponent(playlistId)}`,
        { headers }
      );
      const html2 = await r2.text();
      const m2 = html2.match(/var ytInitialData = (\{.*?\});<\/script>/s);
      if (m2) {
        const d2 = JSON.parse(m2[1]);
        const playlistPanel = d2?.contents?.twoColumnWatchNextResults?.playlist?.playlist;
        if (playlistPanel?.title) {
          playlistTitle = playlistPanel.title;
        }
        const panelContents = playlistPanel?.contents || [];
        for (const item of panelContents) {
          const v = item?.playlistPanelVideoRenderer;
          if (!v || !v.videoId) continue;
          const title = v.title?.simpleText || v.title?.runs?.[0]?.text || '';
          if (!title || title === 'Private video' || title === 'Deleted video') continue;
          const durationText = v.lengthText?.simpleText || '0:00';
          tracks.push({
            index: tracks.length + 1,
            videoId: v.videoId,
            title,
            channel:
              v.longBylineText?.runs?.[0]?.text ||
              v.shortBylineText?.runs?.[0]?.text ||
              'YouTube',
            thumbnail: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
            durationText,
            durationSeconds: parseDurationTextToSeconds(durationText),
          });
        }
      }
    }
  }

  return {
    playlistId,
    title: playlistTitle,
    description: playlistDescription,
    source: 'youtube_live_sync',
    tracks,
  };
}

// ==========================================
// GERMAN RSS NEWS & READER VIEW EXTRACTOR
// ==========================================
interface NewsFeedItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: 'tagesschau' | 'dw' | 'nachrichtenleicht';
  sourceLabel: string;
  level: string;
  image: string;
  summary: string;
  fullTextParagraphs: string[];
}

const cachedArticlesByUrl = new Map<string, NewsFeedItem>();

function cleanHtmlText(rawHtml: string): string[] {
  if (!rawHtml) return [];
  const $ = cheerio.load(rawHtml);
  $('script, style, iframe, nav, footer, aside').remove();
  const paragraphs: string[] = [];

  $('p').each((_, el) => {
    const txt = $(el).text().replace(/\s+/g, ' ').trim();
    if (txt.length >= 25 && !paragraphs.includes(txt)) {
      paragraphs.push(txt);
    }
  });

  if (paragraphs.length === 0) {
    const plain = $.root()
      .text()
      .split(/\n+/)
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter((s) => s.length >= 25);
    paragraphs.push(...plain);
  }
  return paragraphs;
}

async function fetchTagesschauFeed(): Promise<NewsFeedItem[]> {
  try {
    const res = await fetch('https://www.tagesschau.de/xml/rss2/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DeutschMaster/1.0)' },
    });
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const items: NewsFeedItem[] = [];

    $('item')
      .slice(0, 15)
      .each((idx, el) => {
        const $el = $(el);
        const title = $el.find('title').first().text().trim();
        const link = $el.find('link').first().text().trim();
        const pubDate = $el.find('pubDate').first().text().trim();
        const descHtml = $el.find('description').first().text().trim();
        const contentEncoded = $el.find('content\\:encoded, encoded').first().text().trim();

        const $desc = cheerio.load(contentEncoded || descHtml || '');
        const img =
          $desc('img').first().attr('src') ||
          $el.find('enclosure').first().attr('url') ||
          'https://images.tagesschau.de/image/89045d8b-5cd5-46ad-8f91-73911add30ee/AAABh3Y2_7M/tagesschau-logo-100~16x9.jpg';
        const summary = cheerio.load(descHtml || '').root().text().replace(/\s+/g, ' ').trim();
        const fullParagraphs = cleanHtmlText(contentEncoded || descHtml);

        if (title && link) {
          const item: NewsFeedItem = {
            id: `ts-${idx}`,
            title,
            link,
            pubDate: pubDate || new Date().toISOString(),
            source: 'tagesschau',
            sourceLabel: 'Tagesschau (ARD)',
            level: 'B2/C1',
            image: img,
            summary: summary.slice(0, 260),
            fullTextParagraphs: fullParagraphs.length ? fullParagraphs : [summary],
          };
          items.push(item);
          cachedArticlesByUrl.set(link, item);
        }
      });
    return items;
  } catch (err) {
    console.warn('Tagesschau RSS error:', err);
    return [];
  }
}

async function fetchDwFeed(): Promise<NewsFeedItem[]> {
  try {
    const res = await fetch('https://rss.dw.com/xml/rss-de-all', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DeutschMaster/1.0)' },
    });
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const items: NewsFeedItem[] = [];

    $('item')
      .slice(0, 15)
      .each((idx, el) => {
        const $el = $(el);
        const title = $el.find('title').first().text().trim();
        const link = $el.find('link').first().text().trim();
        const pubDate =
          $el.find('pubDate').first().text().trim() ||
          $el.find('dc\\:date, date').first().text().trim();
        const descRaw = $el.find('description').first().text().trim();
        const contentEncoded = $el.find('content\\:encoded, encoded').first().text().trim();
        const $desc = cheerio.load(descRaw || '');
        const summary = $desc.root().text().replace(/\s+/g, ' ').trim();
        const paragraphs = cleanHtmlText(contentEncoded || descRaw);
        const mediaThumb =
          $el.find('media\\:thumbnail, media\\:content, enclosure').first().attr('url') ||
          $desc('img').first().attr('src') ||
          'https://static.dw.com/image/47908265_605.jpg';

        if (title && link) {
          const item: NewsFeedItem = {
            id: `dw-${idx}`,
            title,
            link,
            pubDate: pubDate || new Date().toISOString(),
            source: 'dw',
            sourceLabel: 'DW Deutsch',
            level: 'B1/B2',
            image: mediaThumb,
            summary: summary.slice(0, 260),
            fullTextParagraphs: paragraphs.length ? paragraphs : [summary],
          };
          items.push(item);
          cachedArticlesByUrl.set(link, item);
        }
      });
    return items;
  } catch (err) {
    console.warn('DW RSS error:', err);
    return [];
  }
}

async function fetchNachrichtenleichtFeed(): Promise<NewsFeedItem[]> {
  try {
    const res = await fetch(
      'https://www.nachrichtenleicht.de/nachrichtenleicht-nachrichten-100.html',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const html = await res.text();
    const $ = cheerio.load(html);
    const items: NewsFeedItem[] = [];

    $('article').each((idx, el) => {
      if (items.length >= 12) return;
      const $el = $(el);
      const link = $el.find('a[href*=".html"]').first().attr('href') || '';
      const rawTitle =
        $el.find('h2, h3, .headline-title').first().text().replace(/\s+/g, ' ').trim() ||
        $el.find('a').first().attr('title') ||
        '';
      const half = Math.floor(rawTitle.length / 2);
      const title =
        rawTitle.length > 20 && rawTitle.slice(0, half) === rawTitle.slice(half)
          ? rawTitle.slice(0, half).trim()
          : rawTitle;
      const img = $el.find('img').first().attr('src') || '';
      const summary = $el.find('p').first().text().replace(/\s+/g, ' ').trim();
      const dateStr = $el.find('time, .date, .article-date').first().text().replace(/\s+/g, ' ').trim();

      if (title && link && link.includes('nachrichtenleicht.de')) {
        const item: NewsFeedItem = {
          id: `nl-${idx}`,
          title,
          link,
          pubDate: dateStr || new Date().toISOString(),
          source: 'nachrichtenleicht',
          sourceLabel: 'Nachrichtenleicht (Einfache Sprache)',
          level: 'A2/B1',
          image: img,
          summary,
          fullTextParagraphs: summary ? [summary] : [],
        };
        items.push(item);
        cachedArticlesByUrl.set(link, item);
      }
    });
    return items;
  } catch (err) {
    console.warn('Nachrichtenleicht fetch error:', err);
    return [];
  }
}

async function extractFullArticle(url: string) {
  const cached = cachedArticlesByUrl.get(url);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    $('script, style, nav, footer, header, aside, form, figure figcaption, .shariff, .social, .meta-box').remove();

    const rawTitle =
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text().replace(/\s+/g, ' ').trim() ||
      cached?.title ||
      'Artikel';
    const image =
      $('meta[property="og:image"]').attr('content') ||
      $('article img').first().attr('src') ||
      cached?.image ||
      '';
    const pubDate =
      $('meta[property="article:published_time"]').attr('content')?.slice(0, 10) ||
      $('time').first().text().replace(/\s+/g, ' ').trim() ||
      cached?.pubDate ||
      'Hôm nay';

    const paragraphs: string[] = [];
    const selectors = [
      'article p.textabsatz',
      '.b-article-body p',
      '.article-details-text p',
      'article p',
      'main p',
      '.content p',
    ];

    for (const sel of selectors) {
      $(sel).each((_, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (
          text.length >= 35 &&
          !text.includes('Cookie') &&
          !text.includes('Datenschutz') &&
          !text.includes('JavaScript') &&
          !paragraphs.includes(text)
        ) {
          paragraphs.push(text);
        }
      });
      if (paragraphs.length >= 3) break;
    }

    if (paragraphs.length === 0 && cached?.fullTextParagraphs?.length) {
      paragraphs.push(...cached.fullTextParagraphs);
    }

    return {
      title: rawTitle,
      url,
      pubDate,
      sourceLabel: cached?.sourceLabel || 'Deutsche Presse',
      level: cached?.level || 'B1/B2',
      image,
      paragraphs:
        paragraphs.length > 0
          ? paragraphs
          : [cached?.summary || 'Nội dung bài báo đã sẵn sàng để đọc trên trang gốc.'],
    };
  } catch (err) {
    if (cached) {
      return {
        title: cached.title,
        url,
        pubDate: cached.pubDate,
        sourceLabel: cached.sourceLabel,
        level: cached.level,
        image: cached.image,
        paragraphs: cached.fullTextParagraphs,
      };
    }
    throw err;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // Endpoint 1: Live German News RSS Feed Aggregator
  app.get('/api/news', async (req, res) => {
    try {
      const sourceFilter = String(req.query.source || 'all').toLowerCase();
      const [tsItems, dwItems, nlItems] = await Promise.all([
        sourceFilter === 'all' || sourceFilter === 'tagesschau' ? fetchTagesschauFeed() : [],
        sourceFilter === 'all' || sourceFilter === 'dw' ? fetchDwFeed() : [],
        sourceFilter === 'all' || sourceFilter === 'nachrichtenleicht'
          ? fetchNachrichtenleichtFeed()
          : [],
      ]);

      let combined: NewsFeedItem[] = [];
      if (sourceFilter === 'tagesschau') combined = tsItems;
      else if (sourceFilter === 'dw') combined = dwItems;
      else if (sourceFilter === 'nachrichtenleicht') combined = nlItems;
      else {
        // Interleave items from all 3 sources for a balanced "All" feed
        const maxLen = Math.max(tsItems.length, dwItems.length, nlItems.length);
        for (let i = 0; i < maxLen; i++) {
          if (nlItems[i]) combined.push(nlItems[i]);
          if (dwItems[i]) combined.push(dwItems[i]);
          if (tsItems[i]) combined.push(tsItems[i]);
        }
      }

      return res.json({ items: combined });
    } catch (error: any) {
      console.error('Error in /api/news:', error);
      return res.status(500).json({ error: 'Không thể tải nguồn tin RSS tiếng Đức.' });
    }
  });

  // Endpoint 2: Clean Article Extractor (Reader View)
  app.get('/api/news/article', async (req, res) => {
    try {
      const url = String(req.query.url || '').trim();
      if (!url || !/^https?:\/\//i.test(url)) {
        return res.status(400).json({ error: 'URL bài báo không hợp lệ.' });
      }
      const article = await extractFullArticle(url);
      return res.json(article);
    } catch (error: any) {
      console.error('Error in /api/news/article:', error);
      return res.status(500).json({ error: 'Không thể trích xuất nội dung bài báo.' });
    }
  });

  // Endpoint 3: Live YouTube Playlist Sync
  app.get('/api/youtube/playlist', async (req, res) => {
    const rawList = String(req.query.list || 'PLt3dykZcG7xs0edVsWhD5ul-fL7xg-tf9');
    const playlistId = extractPlaylistId(rawList);

    if (!playlistId) {
      return res.status(400).json({ error: 'Playlist ID không hợp lệ.' });
    }

    const envApiKey = process.env.YOUTUBE_API_KEY;
    const hasValidApiKey =
      envApiKey &&
      envApiKey.trim() !== '' &&
      envApiKey.trim() !== 'MY_YOUTUBE_DATA_API_V3_KEY';

    if (hasValidApiKey) {
      try {
        const apiResult = await fetchViaYouTubeDataApi(playlistId, envApiKey.trim());
        if (apiResult.tracks.length > 0) {
          return res.json(apiResult);
        }
      } catch (err) {
        console.warn('YouTube Data API v3 fallback to live page parser:', err);
      }
    }

    try {
      const liveResult = await fetchViaPublicYouTubePage(playlistId);
      return res.json(liveResult);
    } catch (error: any) {
      console.error('Error fetching YouTube playlist:', error);
      return res.status(500).json({
        error: error?.message || 'Không thể tải danh sách phát YouTube lúc này.',
      });
    }
  });

  // Endpoint 4: Smart 3-Part Lesson Summary (Gemini API)
  app.post('/api/lecture-summary', async (req, res) => {
    try {
      const { transcriptLines, rawText } = req.body || {};
      let contentBlock = '';

      if (Array.isArray(transcriptLines) && transcriptLines.length > 0) {
        contentBlock = transcriptLines
          .map((item: any, idx: number) => {
            const time = item?.time ? `[${item.time}] ` : '';
            const de = String(item?.de || '').trim();
            const vi = String(item?.vi || '').trim();
            if (!de && !vi) return '';
            return `${idx + 1}. ${time}DE: ${de}${vi ? `\n   VI (tham khảo): ${vi}` : ''}`;
          })
          .filter(Boolean)
          .join('\n');
      } else if (typeof rawText === 'string' && rawText.trim()) {
        contentBlock = rawText.trim();
      }

      if (!contentBlock) {
        return res.status(400).json({
          error: 'Chưa có nội dung bài học để phân tích và tóm tắt.',
        });
      }

      const ai = getGenAI();

      const systemInstruction = `Bạn là trợ lý phân tích bài học tiếng Đức thông minh dành cho học viên Việt Nam.
Hãy phân tích nội dung bài học được cung cấp và tạo một bản tóm tắt thông minh, ngắn gọn nhưng đầy đủ thông tin quan trọng theo đúng cấu trúc 3 phần:
1. Ý chính (Zusammenfassung):
- Tóm tắt những nội dung quan trọng nhất bằng 3–7 gạch đầu dòng tùy độ dài.
- Giữ nguyên trình tự logic của nội dung.
- Loại bỏ những câu nói lặp lại, hội thoại ngoài lề, đùa giỡn và thông tin không cần thiết.
- Không dịch nguyên văn mà phải hiểu nội dung trước khi tóm tắt.

2. Kiến thức quan trọng (Wichtige Informationen):
- Trích xuất những kiến thức, nguyên tắc, quy trình và thông tin đáng ghi nhớ.
- Chú ý đặc biệt đến số liệu, thời gian, điều kiện, ví dụ và những điểm được nhấn mạnh.
- Ưu tiên những thông tin có giá trị ứng dụng thực tế hoặc có thể cần thiết khi kiểm tra.
- Phân biệt rõ thông tin có trong bài giảng gốc ("Trong bài giảng") và kiến thức bổ sung nếu có ("Bổ sung" - chỉ bổ sung tối thiểu khi thực sự cần làm rõ thuật ngữ/ngữ pháp, tuyệt đối không bịa đặt sự kiện bài giảng).

3. Từ vựng và thuật ngữ (Wortschatz):
- Chỉ chọn những từ khóa và thuật ngữ chuyên ngành quan trọng, thực sự cần thiết trong bài; tránh liệt kê từ vựng thông thường (như hallo, gut, machen...).
- Với mỗi mục cung cấp:
  + term: Từ vựng / Thuật ngữ gốc (bắt buộc kèm Artikel der/die/das nếu là danh từ tiếng Đức).
  + meaningVi: Nghĩa tiếng Việt chính xác theo ngữ cảnh bài học.
  + note: Ngữ cảnh / Ghi chú ngắn gọn.

Nguyên tắc bắt buộc:
- Sử dụng tiếng Việt làm ngôn ngữ chính để giải thích, giữ nguyên thuật ngữ chuyên ngành gốc.
- Văn phong ngắn gọn, súc tích, không lặp lại ý giữa các phần.
- Tuyệt đối không suy diễn hoặc bịa đặt thông tin không có trong nội dung được cung cấp.
- Nếu có đoạn nội dung không rõ hoặc mơ hồ, đánh dấu rõ là [Không rõ / Cần kiểm tra lại].
- Nếu trong bài giảng có nhắc lịch thi, kiểm tra, bài tập về nhà, hạn nộp hay lưu ý đặc biệt (Prüfung, Test, Klausur, Hausaufgabe, Termin...), liệt kê ngắn gọn vào mảng examAlerts.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Phân tích nội dung bài học dưới đây và trả về JSON theo đúng schema:\n\n${contentBlock}`,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              examAlerts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Các lưu ý về thi cử, kiểm tra, bài tập về nhà nếu có trong bài.',
              },
              zusammenfassung: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 đến 7 gạch đầu dòng tóm tắt ý chính theo trình tự logic.',
              },
              wichtigeInformationen: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    point: {
                      type: Type.STRING,
                      description: 'Kiến thức, nguyên tắc, quy trình, số liệu, thời gian, điều kiện hoặc ví dụ quan trọng.',
                    },
                    sourceTag: {
                      type: Type.STRING,
                      description: 'Ghi rõ "Trong bài giảng" hoặc "Bổ sung".',
                    },
                  },
                  required: ['point', 'sourceTag'],
                },
              },
              wortschatz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: {
                      type: Type.STRING,
                      description: 'Từ vựng / Thuật ngữ gốc (kèm Artikel der/die/das nếu là danh từ).',
                    },
                    meaningVi: {
                      type: Type.STRING,
                      description: 'Nghĩa tiếng Việt.',
                    },
                    note: {
                      type: Type.STRING,
                      description: 'Ngữ cảnh / Ghi chú ngắn.',
                    },
                  },
                  required: ['term', 'meaningVi', 'note'],
                },
              },
            },
            required: ['examAlerts', 'zusammenfassung', 'wichtigeInformationen', 'wortschatz'],
          },
        },
      });

      const rawJson = (response.text || '').trim();
      if (!rawJson) {
        return res.status(502).json({ error: 'Không nhận được phản hồi từ mô hình AI.' });
      }

      const parsed = JSON.parse(rawJson);
      const zusammenfassung: string[] = Array.isArray(parsed.zusammenfassung) ? parsed.zusammenfassung : [];
      const wichtigeInfo: Array<{ point: string; sourceTag?: string }> = Array.isArray(parsed.wichtigeInformationen)
        ? parsed.wichtigeInformationen
        : [];
      const wortschatz: Array<{ term: string; meaningVi: string; note: string }> = Array.isArray(parsed.wortschatz)
        ? parsed.wortschatz
        : [];
      const examAlerts: string[] = Array.isArray(parsed.examAlerts) ? parsed.examAlerts : [];

      const mdLines: string[] = [];
      mdLines.push('## 1. Ý chính (Zusammenfassung)');
      if (zusammenfassung.length) {
        zusammenfassung.forEach((pt) => mdLines.push(`- ${pt}`));
      } else {
        mdLines.push('- [Không rõ / Cần kiểm tra lại]');
      }
      mdLines.push('');
      mdLines.push('## 2. Kiến thức quan trọng (Wichtige Informationen)');
      if (wichtigeInfo.length) {
        wichtigeInfo.forEach((info) => {
          const tag = info.sourceTag && info.sourceTag !== 'Trong bài giảng' ? `[${info.sourceTag}] ` : '[Bài giảng] ';
          mdLines.push(`- ${tag}${info.point}`);
        });
      } else {
        mdLines.push('- Chưa có thông tin nguyên tắc/số liệu cụ thể trong đoạn nội dung.');
      }
      mdLines.push('');
      mdLines.push('## 3. Từ vựng và thuật ngữ (Wortschatz)');
      mdLines.push('| Từ vựng / Thuật ngữ gốc | Nghĩa tiếng Việt | Ngữ cảnh / Ghi chú ngắn |');
      mdLines.push('| --- | --- | --- |');
      if (wortschatz.length) {
        wortschatz.forEach((w) => {
          const clean = (s: string) => String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();
          mdLines.push(`| ${clean(w.term)} | ${clean(w.meaningVi)} | ${clean(w.note)} |`);
        });
      } else {
        mdLines.push('| *(Không có thuật ngữ chuyên ngành nổi bật)* | - | - |');
      }

      return res.json({
        examAlerts,
        zusammenfassung,
        wichtigeInformationen: wichtigeInfo,
        wortschatz,
        markdown: mdLines.join('\n'),
      });
    } catch (error: any) {
      console.error('Error in /api/lecture-summary:', error);
      const status = error?.status && error.status >= 400 && error.status < 600 ? error.status : 500;
      return res.status(status).json({
        error: error?.message || 'Không thể phân tích và tóm tắt bài học lúc này.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DeutschMaster server listening on http://localhost:${PORT}`);
  });
}

startServer();

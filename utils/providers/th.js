const axios = require('axios');
const { kv } = require('../../config');

function extractId(url) {
  const m = url.match(/\/post\/([^/?#]+)/);
  return m ? m[1] : url;
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;

  return m[1]
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

async function fetchThreadsMeta(url) {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/120.0.0.0 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,' +
      'image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Sec-Fetch-Mode': 'navigate',
  };

  const resp = await axios.get(url, { headers, timeout: 20000 });
  const html = resp.data;

  let playUrl = null;

  const videoVersionsMatch = html.match(
    /"video_versions"\s*:\s*(\[[^\]]*\])/s
  );

  if (videoVersionsMatch) {
    const raw = videoVersionsMatch[1];
    const cleaned = raw.replace(/\\u0026/g, '&');

    try {
      const videoVersions = JSON.parse(cleaned);
      if (Array.isArray(videoVersions) && videoVersions.length > 0) {
        const target = videoVersions[0];
        if (target && target.url) {
          playUrl = target.url;
        }
      }
    } catch (_) {}
  }

  if (!playUrl) {
    const mp4Match = html.match(/(https:[^"'\\]+?\.mp4[^"'\\]*)/);
    if (mp4Match) {
      const rawUrl = mp4Match[1];
      playUrl = rawUrl
        .replace(/\\u0026/g, '&')
        .replace(/\\\//g, '/')
        .replace(/\\/g, '');
    }
  }

  const caption = extractTitle(html);

  return { playUrl, caption };
}

async function getThreadsData(url) {
  const postId = extractId(url);
  if (!postId) return null;

  const cacheKey = `threads:${postId}`;

  const cached = await kv.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const { playUrl, caption } = await fetchThreadsMeta(url);
    if (!playUrl) return null;

    const result = {
      provider: 'threads',
      play: playUrl,
      music: null,
      images: null,
      caption: caption || null,
    };

    await kv.set(cacheKey, result, { ex: 3600 });
    return result;
  } catch (e) {
    console.error('Threads Error:', e.message);
    return null;
  }
}

module.exports = { getThreadsData };

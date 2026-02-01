const { igdl } = require('ab-downloader');
const { kv } = require('../../config');

function extractId(url) {
  const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[2] : encodeURIComponent(url);
}

async function getInstaData(url) {
  const contentId = extractId(url);
  const cacheKey = `ig:${contentId}`;

  const cached = await kv.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const data = await igdl(url);
    if (!data) return null;
    const items = Array.isArray(data) ? data : [data];
    const urls = items
      .map(item => item && (item.url || item.downloadUrl))
      .filter(Boolean);

    if (urls.length === 0) {
      console.log('IGDL: URL табылмады');
      return null;
    }

    const result = {
      provider: 'instagram',
      video: urls[0],
      media: urls,
      thumbnail: items[0]?.thumbnail || null,
      raw: data
    };

    await kv.set(cacheKey, result, { ex: 3600 });
    return result;
  } catch (e) {
    console.error('IG Provider Error:', e.message);
    return null;
  }
}

module.exports = { getInstaData };

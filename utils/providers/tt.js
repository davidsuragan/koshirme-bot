const { ttdl } = require('ab-downloader');
const { kv } = require('../../config');

function extractId(url) {
  const match = url.match(/\/video\/(\d+)/) || url.match(/v\/(\d+)/);
  return match ? match[1] : url;
}

async function getTikTokData(url) {
  const videoId = extractId(url);
  if (!videoId) {
    return null;
  }
  const cacheKey = `tt:${videoId}`;

  const cached = await kv.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const data = await ttdl(url);
    if (!data) return null;

    let videoUrl = data.play || data.wmplay || data.video;

    if (Array.isArray(videoUrl)) {
      videoUrl = videoUrl[0];
    }
    
    let audioUrl = data.music || data.audio;
    if (Array.isArray(audioUrl)) {
      audioUrl = audioUrl[0];
    }

    const result = {
      provider: 'tiktok',
      play: videoUrl,
      music: audioUrl || null, 
      images: data.images || null, 
      caption: data.title || null 
    };

    await kv.set(cacheKey, result, { ex: 3600 });
    return result;
  } catch (e) {
    console.error('TT Error:', e.message);
    return null;
  }
}

module.exports = { getTikTokData };

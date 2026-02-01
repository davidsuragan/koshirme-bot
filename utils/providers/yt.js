const ytdl = require('cloud-ytdl');
const { kv } = require('../../config');

function extractId(url) {
  const match = url.match(/(?:v=|\/|youtu\.be\/|shorts\/|embed\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : Date.now().toString();
}

async function getYtData(url) {
  const videoId = extractId(url);
  const cacheKey = `yt:${videoId}`;

  const cached = await kv.get(cacheKey);
  if (cached) return cached;

  try {
    const info = await ytdl.getInfo(url);
    if (!info) return null;

    const details = info.videoDetails;

    let bestVideo;
    try {
      bestVideo = ytdl.chooseFormat(info.formats, { 
        quality: 'highest', 
        filter: 'audioandvideo' 
      });
    } catch (e) {
      bestVideo = ytdl.chooseFormat(info.formats, { quality: 'highest' });
    }

    const bestAudio = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });

    const result = {
      provider: 'youtube',
      title: details.title,
      video: bestVideo?.url || null,
      music: bestAudio?.url || null,
    };

    await kv.set(cacheKey, result, { ex: 3600 });
    return result;

  } catch (err) {
    console.error('YT Provider Error:', err);
    return null;
  }
}

module.exports = { getYtData };
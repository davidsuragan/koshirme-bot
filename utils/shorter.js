const axios = require('axios');

async function clck(url) {
  try {
    const requestUrl = `https://clck.ru/--?url=${encodeURIComponent(url)}`;
    const response = await axios.get(requestUrl, { timeout: 10000 });

    if (response.data && response.data.startsWith('http')) {
      return response.data.trim();
    }

    return null;
  } catch (e) {
    console.error('clck.ru error:', e.message);
    return null;
  }
}

async function isGd(url) {
  try {
    const response = await axios.get(
      "https://is.gd/create.php",
      {
        params: { 
          format: "simple", 
          url: url          
        },
        timeout: 10000
      }
    );

    const txt = String(response.data || "").trim();

    if (txt.startsWith("http")) {
      return txt;
    }

    return null;
  } catch (e) {
    console.error("is.gd error:", e.message);
    return null;
  }
}

async function shorterUrl(url) {
  const a = await clck(url);
  if (a) return a;

  const b = await isGd(url);
  if (b) return b;

  return url;
}

module.exports = { shorterUrl };

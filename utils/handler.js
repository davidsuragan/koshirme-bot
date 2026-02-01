const { getTikTokData, getInstaData, getYtData, getThreadsData } = require('./providers');
const { shorterUrl } = require('./shorter');
const { ADMIN_ID } = require('../config');
const axios = require('axios');

async function textHandler(ctx) {
  const userMessage = ctx.message.text;
  const urls = userMessage.match(/https?:\/\/[^\s]+/g);
  
  if (urls && urls.length > 1) {
    await ctx.reply(
      '⚠️ <b>Өтініш, бір хабарламада тек 1 сілтеме жіберіңіз!</b>\nМен кезекпен жұмыс істеймін.', 
      { parse_mode: 'HTML', reply_to_message_id: ctx.message.message_id }
    );
    return;
  }

  let data = null;
  let shortUrl = urls && urls[0] ? urls[0] : ''; 

  try {
    if (/tiktok\.com/i.test(userMessage)) {
      await ctx.replyWithChatAction('upload_video');
      data = await getTikTokData(userMessage);
    } 
    else if (/instagram\.com/i.test(userMessage)) {
      await ctx.replyWithChatAction('upload_video');
      data = await getInstaData(userMessage);
    } 
    else if (/youtube\.com|youtu\.be/i.test(userMessage)) {
      await ctx.replyWithChatAction('upload_video');
      data = await getYtData(userMessage);
    }
    else if (/threads\.(net|com)/i.test(userMessage)) {
      await ctx.replyWithChatAction('upload_video');
      data = await getThreadsData(userMessage);
    }
    else if (/(facebook\.com|fb\.watch|twitter\.com)/i.test(userMessage)) {
      await ctx.reply(
        'Бұл платформа әзірге қолдау көрсетпейді.',
        { reply_to_message_id: ctx.message.message_id }
      );
      return;
    } 
    else {
      return;
    }

    if (!data) {
      await ctx.reply('Мәлімет табылмады. API жауап бермеді.');
      return;
    }

    let mediaUrl = data.play || data.video || data.media;
    if (Array.isArray(mediaUrl)) mediaUrl = mediaUrl[0];

    let title = data.caption || data.title || '';
    if (title && data.provider === 'tiktok') {
      title = title.split('#')[0].trim();
    }

    let caption = '';
    if (title) caption += `${title}\n`;
    caption += `Мінекей 😉\n\n@koshirmebot`;

    if (mediaUrl && data.provider === 'threads') {
      await ctx.replyWithVideo(
        { url: mediaUrl },
        {
          caption,
          parse_mode: 'HTML',
          reply_to_message_id: ctx.message.message_id,
        }
      );
      return;
    }

    if (mediaUrl) {
      
      try {
        const response = await axios({
          method: 'get',
          url: mediaUrl,
          responseType: 'stream' 
        });

        await ctx.replyWithVideo({ source: response.data }, {
            caption: caption, 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message.message_id
        });
        return; 
      } catch (streamError) {
        console.error('Stream error, switching to fallback:', streamError.message);
      }

      try {
        shortUrl = await shorterUrl(mediaUrl);
      } catch (e) {
        shortUrl = mediaUrl; 
      }

      let fullCaption = '';
      if (title) fullCaption += `${title}\n`;

      fullCaption +=
        `<a href="${mediaUrl}">&#8203;</a>` +
        `<a href="${shortUrl}">Мінекей 👈😎</a>\n\n` +
        `@koshirmebot`;

      if (data.provider === 'tiktok' && data.images && data.images.length > 0) {
        fullCaption += `\n(Слайдшоу)`;
      }

      await ctx.telegram.sendMessage(ctx.chat.id, fullCaption, {
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message.message_id,
        disable_web_page_preview: false
      });
    } 
    else if (data.music) {
      await ctx.replyWithAudio(data.music, {
        caption: '@koshirmebot',
        reply_to_message_id: ctx.message.message_id
      });
    }

  } catch (e) {
    console.error('Handler error:', e);
    const errorText =
      `Видеоны жүктей алмадым (сілтеме ескірген болуы мүмкін).\nТікелей көріңіз:\n` +
      `<a href="${shortUrl}">Сілтеме 👈</a>\n\n` +
      `@koshirmebot`;

    await ctx.reply(errorText, {
      parse_mode: "HTML",
      reply_to_message_id: ctx.message.message_id
    });
  }
}

function addLimitsCommand(bot, kv) {
  bot.command('limits', async (ctx) => {
    if (!ctx.from) return;

    const today = new Date().toISOString().split('T')[0];
    const key = `limit:${ctx.from.id}:${today}`; 

    const record = await kv.get(key);
    
    const count = parseInt(record) || 0;

    if (ADMIN_ID && String(ctx.from.id) === String(ADMIN_ID)) {
      await ctx.reply(
        `👑 <b>Сіз админсіз.</b>\nЛимит: <b>шексіз</b>.`,
        { parse_mode: 'HTML', reply_to_message_id: ctx.message.message_id }
      );
      return;
    }

    const ttlSec = await kv.ttl(key);

    let extraMessage = '';
    let nextUseText = '';

    if (count < 3) {
      const left = 3 - count;
      extraMessage = `\n🟢 <b>Әлі ${left} видео жүктей аласыз.</b>\nСілтемені жіберсеңіз болды 😊`;
    }

    if (count >= 3 && ttlSec > 0) {
      const utcNow = new Date();
      const nextUseUTC = new Date(utcNow.getTime() + ttlSec * 1000);
      const nextUse = new Date(nextUseUTC.getTime() + 5 * 60 * 60 * 1000); // +5 сағат (KZ уақыты)

      const day   = String(nextUse.getUTCDate()).padStart(2, '0');
      const month = String(nextUse.getUTCMonth() + 1).padStart(2, '0');
      const year  = nextUse.getUTCFullYear();
      const hours = String(nextUse.getUTCHours()).padStart(2, '0');
      const mins  = String(nextUse.getUTCMinutes()).padStart(2, '0');

      nextUseText = `\n⏳ Жаңартылуы: <b>${day}.${month}.${year} ${hours}:${mins}</b>`;
    }

    await ctx.reply(
      `📊 <b>Статус:</b> ${count}/3 қолданылды.${extraMessage}${nextUseText}`,
      { parse_mode: 'HTML', reply_to_message_id: ctx.message.message_id }
    );
  });
}

function startComand(bot){
  bot.command('start', (ctx) => {
    ctx.reply(
      'TikTok, Instagram, Threads, YouTube-тан видео жүктеу үшін сілтеме жібер.\n\n' +
      '<blockquote>' +
        'TikTok видеолары әрқашан жоғары сапада жүктеледі 🔥\n' +
      '</blockquote>' + 
      'build by @davidsuragan',
      { parse_mode: 'HTML' }
    );
  });
}

function textF(bot){
  bot.on('text', textHandler);
}

module.exports = { textF, startComand, addLimitsCommand };
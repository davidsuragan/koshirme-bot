const { ADMIN_ID } = require('../config');

function checkLimitMiddleware(kv) {
  return async (ctx, next) => {
    if (!ctx.from) return next();

    const text = ctx.message?.text;
    if (!text) return next();

    const isLink = /tiktok\.com|instagram\.com|youtube\.com|youtu\.be/i.test(text);
    if (!isLink) {
      return next(); 
    }

    if (ADMIN_ID && String(ctx.from.id) === String(ADMIN_ID)) {
      return next();
    }

    const today = new Date().toISOString().split('T')[0];
    const key = `limit:${ctx.from.id}:${today}`; 

    const record = await kv.get(key);
    
    const count = parseInt(record) || 0; 

    if (count >= 3) {
      await ctx.reply(
        '⛔️ <b>Бүгінгі лимит таусылды (3/3).</b>\nКелесі мүмкіндік: ертең.', 
        { parse_mode: 'HTML', reply_to_message_id: ctx.message.message_id }
      );
      return; 
    }
    await kv.set(key, count + 1, { ex: 86400 });
    await next();
  };
}

module.exports = { checkLimitMiddleware };
const { Telegraf } = require('telegraf');
const { BOT_TOKEN, kv } = require('./config');
const { checkLimitMiddleware } = require('./utils/middleware');
const { startComand, addLimitsCommand, textF} = require('./utils/handler');

const bot = new Telegraf(BOT_TOKEN);

bot.use(checkLimitMiddleware(kv));

addLimitsCommand(bot, kv);  
startComand(bot);
textF(bot);

if (process.env.APP_MODE === 'local') {
  bot.launch()
    .then(() => {
      console.log('✅ Бот ЛОКАЛЬНО іске қосылды (Polling)!');
      console.log('Тоқтату үшін: Ctrl + C');
    })
    .catch((err) => console.error('Бот қосылмады:', err));
    
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

} else {
  module.exports = async (req, res) => {
    try {
      if (req.method === 'GET' && req.url.includes('set_webhook')) {
        const webhookUrl = `https://${req.headers.host}/webhook`;
        await bot.telegram.setWebhook(webhookUrl);
        return res.send(`✅ Вебхук орнатылды: ${webhookUrl}`);
      }

      if (req.method === 'GET' && req.url.includes('del')) {
        await bot.telegram.deleteWebhook();
        return res.send('🗑 Вебхук өшірілді.');
      }

      if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        return res.status(200).send('OK');
      }

      return res.send('Бот жұмыс істеп тұр (Serverless)');
    } catch (e) {
      console.error(e);
      return res.status(500).send(e.message);
    }
  };
}
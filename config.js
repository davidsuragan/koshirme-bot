require("dotenv").config();
const { Redis } = require("@upstash/redis");

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const isLocal = process.env.APP_MODE === 'local';
console.log(isLocal ? '🔧 Режим: LOCAL (Тест бот)' : '🚀 Режим: PRODUCTION (Негізгі бот)');

module.exports = {
  kv,
  BOT_TOKEN: isLocal ? process.env.TOKEN_LOCAL : process.env.TOKEN_PROD,
  ADMIN_ID: process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : null,
};
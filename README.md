# Koshirme Bot

Telegram-да хабарламалар санын немесе лимиттерін басқаруға арналған көмекші бот.

## Технологиялар

- **Runtime:** Node.js
- **Framework:** Telegraf
- **Platform:** Vercel (Serverless). `vercel.json` арқылы `app.js` іске
  қосылады.
- **Database:** Upstash Redis (KV)

## Деплой (Vercel)

0. Алдымен Vercel CLI орнатып, жүйеге кіріңіз:

```bash
npm install -g vercel
vercel login
```

1. Жоба папкасына `.env` файлын жасап, қажетті айнымалыларды жазыңыз (Vercel
   `.env` файлын автоматты түрде оқиды):

**Қажетті `.env` айнымалылары:**

```env
TOKEN_PROD=your_prod_token
KV_REST_API_URL=your_upstash_url
KV_REST_API_TOKEN=your_upstash_token
ADMIN_ID=your_id
APP_MODE=production
```

2. Vercel CLI арқылы деплой жасаңыз:

```bash
vercel --prod
```

3. Деплой жасағаннан кейін вебхук орнату үшін
   `https://...vercel.app/set_webhook` мекенжайын ашыңыз.

---

Авторы: [@daketeach](https://t.me/daketeach)

require('dotenv').config();

async function main() {
  const { Bot } = await import('@maxhub/max-bot-api');

  const token = process.env.MAX_BOT_TOKEN;

  if (!token) {
    console.error('Ошибка: MAX_BOT_TOKEN не найден в .env');
    process.exit(1);
  }

  const bot = new Bot(token);

  bot.command('start', async (ctx) => {
    await ctx.reply(
      'Привет! 👋\n\nЯ помогу дождаться подходящего времени для записи к врачу.'
    );
  });

  bot.on('bot_started', async (ctx) => {
    await ctx.reply(
      'Привет! 👋\n\nЯ помогу дождаться подходящего времени для записи к врачу.'
    );
  });

  console.log('Запускаю MAX-бота...');

  await bot.start();

  console.log('MAX-бот запущен и ждёт сообщения.');
}

main().catch((error) => {
  console.error('Ошибка запуска бота:');
  console.error(error);
  process.exit(1);
});
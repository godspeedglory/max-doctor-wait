require('dotenv').config();

const { createNotifier } = require('./notifications');
const { saveUser } = require('./users');

async function main() {

  const { Bot, Keyboard } = await import('@maxhub/max-bot-api');

  const token = process.env.MAX_BOT_TOKEN;

  if (!token) {
    console.error('Ошибка: MAX_BOT_TOKEN не найден в .env');
    process.exit(1);
  }


  const bot = new Bot(token);

  // Подключаем уведомления
  const { notifyUser } = createNotifier(bot);



  // ==========================================
  // КЛАВИАТУРА
  // ==========================================

  const startKeyboard = Keyboard.inlineKeyboard([
    [
      Keyboard.button.callback(
        '🔎 Ждать свободное окно',
        'create_waiting'
      )
    ]
  ]);



  // ==========================================
  // СОХРАНЕНИЕ ПОЛЬЗОВАТЕЛЯ + ПРИВЕТСТВИЕ
  // ==========================================

  async function sendWelcome(ctx) {

    const userId = ctx.user?.user_id;


    if (userId) {

      saveUser({
        userId: userId,
        name: ctx.user?.first_name
      });

      console.log(
        `👤 Пользователь MAX: ${userId}`
      );
    }


    await ctx.reply(
      'Привет! 👋\n\n' +
      'Я помогу дождаться подходящего времени для записи к врачу.\n\n' +
      'Нажми кнопку ниже, чтобы настроить ожидание.',
      {
        attachments: [startKeyboard]
      }
    );

  }


  bot.command('start', sendWelcome);

  bot.on('bot_started', sendWelcome);




  // ==========================================
  // КНОПКА ОЖИДАНИЯ
  // ==========================================

  bot.action('create_waiting', async (ctx) => {

    await ctx.reply(
      'Отлично! ✅\n\n' +
      'Ожидание записи будет настроено через Mini App.'
    );

  });




  // ==========================================
  // ТЕСТ УВЕДОМЛЕНИЯ
  // ==========================================

  bot.command('testslot', async (ctx) => {

    const userId = ctx.user?.user_id;


    if (!userId) {

      console.error(
        '❌ Не удалось определить user_id'
      );

      return;
    }


    console.log(
      `🧪 Имитируем найденный слот для пользователя ${userId}`
    );


    const testSlot = {

      specialty: 'Терапевт',

      date: '21 сентября',

      time: '14:30'

    };


    await notifyUser(
      userId,
      testSlot
    );

  });




  // ==========================================
  // ЗАПУСК
  // ==========================================

  console.log(
    'Запускаю MAX-бота...'
  );


  await bot.start();


  console.log(
    'MAX-бот запущен и ждёт сообщения.'
  );

}


main().catch((error) => {

  console.error(
    'Ошибка запуска бота:'
  );

  console.error(error);

  process.exit(1);

});
require('dotenv').config();

const http = require('http');
const { notifyUser } = require('./notifications');
const { saveUser } = require('./users');

async function main() {

  const { Bot } = await import('@maxhub/max-bot-api');

  const token = process.env.MAX_BOT_TOKEN;

  if (!token) {
    console.error('Ошибка: MAX_BOT_TOKEN не найден в .env');
    process.exit(1);
  }

  const bot = new Bot(token);


  // ============================
  // Локальный сервер уведомлений
  // ============================

  const notificationServer = http.createServer((req, res) => {

    if (req.method !== 'POST' || req.url !== '/notify') {

      res.writeHead(404, {
        'Content-Type': 'application/json'
      });

      res.end(
        JSON.stringify({
          error: 'Not found'
        })
      );

      return;
    }

    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {

      try {

        const {
          userId,
          appointment
        } = JSON.parse(body);

        if (!userId || !appointment) {

          res.writeHead(400, {
            'Content-Type': 'application/json'
          });

          res.end(
            JSON.stringify({
              error: 'userId and appointment are required'
            })
          );

          return;
        }

        console.log(
          `📨 Получено уведомление для пользователя ${userId}`
        );

        const sent = await notifyUser(
          bot,
          userId,
          appointment
        );

        res.writeHead(sent ? 200 : 500, {
          'Content-Type': 'application/json'
        });

        res.end(
          JSON.stringify({
            sent
          })
        );

      } catch (error) {

        console.error(
          'Ошибка /notify:',
          error
        );

        res.writeHead(400, {
          'Content-Type': 'application/json'
        });

        res.end(
          JSON.stringify({
            error: 'Invalid request'
          })
        );

      }

    });

  });


  const notificationHost =
    process.env.NOTIFICATION_HOST || '127.0.0.1';

  notificationServer.listen(
    3001,
    notificationHost,
    () => {

      console.log(
        `Сервис уведомлений запущен на http://${notificationHost}:3001`
      );

    }
  );


  // ============================
  // /start
  // ============================

  async function sendWelcome(ctx) {

    const userId = ctx.user?.user_id;

    if (userId) {

      saveUser({
        userId: userId,
        name: ctx.user?.first_name
      });

      console.log(
        `👤 Пользователь MAX сохранён: ${userId}`
      );

    }

    if (userId) {
     await bot.api.sendMessageToUser(
        userId,
        'Привет! 👋\n\n' +
        'Я помогу дождаться подходящего времени для записи к врачу.\n\n' +
        'Чтобы создать ожидание, нажмите кнопку «Открыть» в интерфейсе MAX.'
      );
    }

  }


  bot.command(
    'start',
    sendWelcome
  );


  bot.on(
    'bot_started',
    sendWelcome
  );


  // ============================
  // Тест уведомления
  // ============================

  bot.command(
    'testslot',
    async (ctx) => {

      const userId = ctx.user?.user_id;

      if (!userId) {

        console.log(
          '❌ Не найден user_id'
        );

        return;
      }

      const appointment = {

        specialty: 'Терапевт',

        date: '21 сентября',

        time: '14:30'

      };

      console.log(
        `🧪 Отправка тестового уведомления пользователю ${userId}`
      );

      await notifyUser(
        bot,
        userId,
        appointment
      );

    }
  );


  // ============================
  // Запуск
  // ============================

  console.log(
    'Запускаю MAX-бота...'
  );

  await bot.start();

  console.log(
    'MAX-бот запущен и ждёт сообщения.'
  );

}


main().catch(
  (error) => {

    console.error(
      'Ошибка запуска бота:'
    );

    console.error(error);

    process.exit(1);

  }
);
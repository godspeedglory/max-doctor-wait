function createNotifier(bot) {

  async function notifyUser(userId, slot) {

    const message =
      '🎉 Нашлось свободное окно!\n\n' +
      `👨‍⚕️ Специальность: ${slot.specialty}\n` +
      `📅 Дата: ${slot.date}\n` +
      `🕐 Время: ${slot.time}\n\n` +
      'Открой приложение, чтобы посмотреть запись.';

    try {

      await bot.api.sendMessageToUser(userId, message);

      console.log(
        `✅ Уведомление отправлено пользователю ${userId}`
      );

      return true;

    } catch (error) {

      console.error(
        `❌ Ошибка отправки уведомления пользователю ${userId}:`
      );

      console.error(error);

      return false;
    }
  }

  return {
    notifyUser
  };
}

module.exports = {
  createNotifier
};
async function notifyUser(bot, userId, appointment) {

  const message =
    ' Нашлось свободное окно!\n\n' +
    ` Специальность: ${appointment.specialty}\n` +
    ` Дата: ${appointment.date}\n` +
    ` Время: ${appointment.time}\n\n` +
    'Открой приложение, чтобы посмотреть запись.';


  try {

    await bot.api.sendMessageToUser(
      userId,
      message
    );


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


module.exports = {
  notifyUser
};
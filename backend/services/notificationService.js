function createMatchNotification(match) {
  const notification = {
    type: "appointment_found",
    userId: match.userId,

    appointment: {
      doctorId: match.slot.doctorId,
      doctorName: match.slot.doctorName,
      specialty: match.slot.specialty,
      date: match.slot.date,
      time: match.slot.time
    }
  };

  console.log("Найдено совпадение для бота:");
  console.log(notification);

  return notification;
}

module.exports = { createMatchNotification };
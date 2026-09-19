function isSlotMatching(request, slot) {
  // Врач должен быть нужной специальности
  if (request.specialty !== slot.specialty) {
    return false;
  }

  // Слот должен быть свободен
  if (!slot.available) {
    return false;
  }

  // Дата должна входить в выбранный период
  if (slot.date < request.dateFrom || slot.date > request.dateTo) {
    return false;
  }

  // День недели должен подходить
  if (!request.weekdays.includes(slot.weekday)) {
    return false;
  }

  // Время должно входить в выбранный диапазон
  if (slot.time < request.timeFrom || slot.time > request.timeTo) {
    return false;
  }

  return true;
}

module.exports = { isSlotMatching };
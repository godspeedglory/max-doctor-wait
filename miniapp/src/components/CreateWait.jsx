import { useState } from "react";

const specialties = [
  "Терапевт",
  "Стоматолог",
  "Невролог",
  "Офтальмолог",
  "Дерматолог",
  "Кардиолог",
];

const weekDays = [
  { short: "Пн", full: "Понедельник" },
  { short: "Вт", full: "Вторник" },
  { short: "Ср", full: "Среда" },
  { short: "Чт", full: "Четверг" },
  { short: "Пт", full: "Пятница" },
  { short: "Сб", full: "Суббота" },
  { short: "Вс", full: "Воскресенье" },
];

function CreateWait({ onCreate }) {
  const [specialty, setSpecialty] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function toggleDay(day) {
    setSelectedDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((item) => item !== day)
        : [...currentDays, day]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (selectedDays.length === 0) {
      setMessage("Выберите хотя бы один день недели");
      return;
    }

    if (dateFrom > dateTo) {
      setMessage("Дата начала не может быть позже даты окончания");
      return;
    }

    if (timeFrom >= timeTo) {
      setMessage("Время начала должно быть раньше времени окончания");
      return;
    }

    const weekdays = selectedDays.map((shortDay) => {
      const day = weekDays.find((item) => item.short === shortDay);
      return day.full;
    });

    // Внутри MAX берём настоящий ID пользователя.
    // При обычном локальном запуске используем тестовый ID.
    const maxUserId = window.WebApp?.initDataUnsafe?.user?.id;

    const userId = maxUserId
      ? String(maxUserId)
      : "maya_test";

    const waitRequest = {
      userId,
      specialty,
      dateFrom,
      dateTo,
      weekdays,
      timeFrom,
      timeTo,
    };

    try {
      setIsLoading(true);

      const response = await fetch(
        "https://portland-senators-blonde-largest.trycloudflare.com/api/waiting-requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(waitRequest),
        }
      );

      if (!response.ok) {
        throw new Error("Не удалось создать ожидание");
      }

      const createdWait = await response.json();

      onCreate({
        ...createdWait,
        days: createdWait.weekdays,
      });

      setSpecialty("");
      setDateFrom("");
      setDateTo("");
      setSelectedDays([]);
      setTimeFrom("");
      setTimeTo("");
      setMessage("");
    } catch (error) {
      console.error("Ошибка создания ожидания:", error);
      setMessage("Не удалось создать ожидание. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <header className="header">
        <h1>Найти запись к врачу</h1>
        <p>Укажите, какую запись нужно отслеживать</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="specialty">Специальность врача</label>

          <select
            id="specialty"
            value={specialty}
            onChange={(event) => setSpecialty(event.target.value)}
            required
          >
            <option value="">Выберите специальность</option>

            {specialties.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Период</label>

          <div className="row">
            <div>
              <span>С</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                required
              />
            </div>

            <div>
              <span>По</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="field">
          <label>Дни недели</label>

          <div className="days">
            {weekDays.map((day) => (
              <button
                key={day.short}
                type="button"
                className={
                  selectedDays.includes(day.short)
                    ? "day active"
                    : "day"
                }
                onClick={() => toggleDay(day.short)}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Удобное время</label>

          <div className="row">
            <div>
              <span>С</span>
              <input
                type="time"
                value={timeFrom}
                onChange={(event) => setTimeFrom(event.target.value)}
                required
              />
            </div>

            <div>
              <span>До</span>
              <input
                type="time"
                value={timeTo}
                onChange={(event) => setTimeTo(event.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <button
          className="submit-button"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Создаём..." : "Начать отслеживание"}
        </button>

        {message && <p className="message error">{message}</p>}
      </form>
    </>
  );
}

export default CreateWait;
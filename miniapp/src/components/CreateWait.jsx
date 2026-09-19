import { useState } from "react";

const specialties = [
  "Терапевт",
  "Стоматолог",
  "Невролог",
  "Офтальмолог",
  "Дерматолог",
  "Кардиолог",
];

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function CreateWait({ onCreate }) {
  const [specialty, setSpecialty] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [message, setMessage] = useState("");

  function toggleDay(day) {
    setSelectedDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((item) => item !== day)
        : [...currentDays, day]
    );
  }

  function handleSubmit(event) {
    event.preventDefault();

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

    const waitRequest = {
      id: Date.now(),
      specialty,
      dateFrom,
      dateTo,
      days: selectedDays,
      timeFrom,
      timeTo,
    };

    onCreate(waitRequest);

    setSpecialty("");
    setDateFrom("");
    setDateTo("");
    setSelectedDays([]);
    setTimeFrom("");
    setTimeTo("");
    setMessage("");
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
                key={day}
                type="button"
                className={
                  selectedDays.includes(day) ? "day active" : "day"
                }
                onClick={() => toggleDay(day)}
              >
                {day}
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

        <button className="submit-button" type="submit">
          Начать отслеживание
        </button>

        {message && <p className="message error">{message}</p>}
      </form>
    </>
  );
}

export default CreateWait;
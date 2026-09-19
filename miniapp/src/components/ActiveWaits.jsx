function formatDate(date) {
  if (!date) return "";

  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}

function ActiveWaits({ waits, onDelete, onCreateClick }) {
  return (
    <>
      <header className="header">
        <h1>Активные ожидания</h1>
        <p>Мы сообщим, когда появится подходящая запись</p>
      </header>

      {waits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⌕</div>

          <h2>Пока ничего нет</h2>

          <p>Создайте ожидание, и оно появится здесь</p>

          <button
            className="secondary-button"
            onClick={onCreateClick}
          >
            Создать ожидание
          </button>
        </div>
      ) : (
        <div className="waits-list">
          {waits.map((wait) => (
            <div className="wait-card" key={wait.id}>
              <div className="wait-card-header">
                <h2>{wait.specialty}</h2>
                <span className="status">Активно</span>
              </div>

              <p className="wait-info">
                <strong>Период:</strong>{" "}
                {formatDate(wait.dateFrom)} — {formatDate(wait.dateTo)}
              </p>

              <p className="wait-info">
                <strong>Дни:</strong> {wait.days.join(", ")}
              </p>

              <p className="wait-info">
                <strong>Время:</strong>{" "}
                {wait.timeFrom} — {wait.timeTo}
              </p>

              <button
                className="delete-button"
                onClick={() => onDelete(wait.id)}
              >
                Удалить ожидание
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default ActiveWaits;
import { useEffect, useState } from "react";
import "./App.css";
import CreateWait from "./components/CreateWait";
import ActiveWaits from "./components/ActiveWaits";

function App() {
  const [screen, setScreen] = useState("create");
  const [waits, setWaits] = useState([]);

  useEffect(() => {
    async function loadWaits() {
      try {
        const response = await fetch(
          "https://litigation-boating-yesterday-cooling.trycloudflare.com/api/waiting-requests"
        );

        if (!response.ok) {
          throw new Error("Не удалось загрузить ожидания");
        }

        const data = await response.json();

        const normalizedWaits = data
          .filter((wait) => wait.status === "active")
          .map((wait) => ({
            ...wait,
            days: wait.weekdays,
          }));

        setWaits(normalizedWaits);
      } catch (error) {
        console.error("Ошибка загрузки ожиданий:", error);
      }
    }

    loadWaits();
  }, []);

  function createWait(wait) {
    setWaits((currentWaits) => [...currentWaits, wait]);
    setScreen("waits");
  }

  async function deleteWait(id) {
    try {
      const response = await fetch(
        `https://litigation-boating-yesterday-cooling.trycloudflare.com/api/waiting-requests/${id}/cancel`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error("Не удалось отменить ожидание");
      }

      setWaits((currentWaits) =>
        currentWaits.filter((wait) => wait.id !== id)
      );
    } catch (error) {
      console.error("Ошибка отмены ожидания:", error);
    }
  }

  return (
    <>
      <main className="app">
        {screen === "create" && <CreateWait onCreate={createWait} />}

        {screen === "waits" && (
          <ActiveWaits
            waits={waits}
            onDelete={deleteWait}
            onCreateClick={() => setScreen("create")}
          />
        )}
      </main>

      <nav className="bottom-nav">
        <button
          className={screen === "create" ? "nav-button active" : "nav-button"}
          onClick={() => setScreen("create")}
        >
          <span className="nav-icon">＋</span>
          <span>Создать</span>
        </button>

        <button
          className={screen === "waits" ? "nav-button active" : "nav-button"}
          onClick={() => setScreen("waits")}
        >
          <span className="nav-icon">⌕</span>
          <span>Ожидания</span>
        </button>
      </nav>
    </>
  );
}

export default App;
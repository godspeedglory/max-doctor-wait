import { useState } from "react";
import "./App.css";

import CreateWait from "./components/CreateWait";
import ActiveWaits from "./components/ActiveWaits";

function App() {
  const [screen, setScreen] = useState("create");
  const [waits, setWaits] = useState([]);

  function createWait(wait) {
    setWaits((currentWaits) => [...currentWaits, wait]);
    setScreen("waits");
  }

  function deleteWait(id) {
    setWaits((currentWaits) =>
      currentWaits.filter((wait) => wait.id !== id)
    );
  }

  return (
    <>
      <main className="app">
        {screen === "create" && (
          <CreateWait onCreate={createWait} />
        )}

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
          className={
            screen === "create"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() => setScreen("create")}
        >
          <span className="nav-icon">＋</span>
          <span>Создать</span>
        </button>

        <button
          className={
            screen === "waits"
              ? "nav-button active"
              : "nav-button"
          }
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
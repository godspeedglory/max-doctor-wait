const express = require("express");
const cors = require("cors");

const waitingRequests = require("./data/waitingRequests");
const doctorSchedule = require("./data/doctorSchedule");
const { isSlotMatching } = require("./services/matchingEngine");
const {
  createMatchNotification,
} = require("./services/notificationService");

const app = express();
const PORT = 3000;

const BOT_NOTIFICATION_URL = "http://127.0.0.1:3001/notify";

// Разрешаем запросы из Mini App на Vercel
app.use(
  cors({
    origin: "https://max-doctor-wait.vercel.app",
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());


// ============================
// Отправка уведомления боту
// ============================

async function sendNotificationToBot(notification) {
  try {
    const response = await fetch(BOT_NOTIFICATION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: notification.userId,
        appointment: notification.appointment,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Ошибка отправки уведомления боту:",
        response.status,
        errorText
      );

      return false;
    }

    const result = await response.json();

    console.log(
      `Уведомление передано боту для пользователя ${notification.userId}`
    );

    return result.sent === true;
  } catch (error) {
    console.error(
      "Не удалось подключиться к сервису уведомлений:",
      error.message
    );

    return false;
  }
}


// ============================
// Главная
// ============================

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "MAX backend is running",
  });
});


// ============================
// Ожидания
// ============================

app.get("/api/waiting-requests", (req, res) => {
  res.json(waitingRequests);
});


app.post("/api/waiting-requests", (req, res) => {
  const {
    userId,
    specialty,
    dateFrom,
    dateTo,
    weekdays,
    timeFrom,
    timeTo,
  } = req.body;

  if (!userId) {
    return res.status(400).json({
      error: "userId is required",
    });
  }

  const newRequest = {
    id: waitingRequests.length + 1,
    userId,
    specialty,
    dateFrom,
    dateTo,
    weekdays,
    timeFrom,
    timeTo,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  waitingRequests.push(newRequest);

  res.status(201).json(newRequest);
});


// ============================
// Расписание
// ============================

app.get("/api/schedule", (req, res) => {
  res.json(doctorSchedule);
});


// ============================
// Все совпадения
// ============================

app.get("/api/matches", (req, res) => {
  const matches = [];

  for (const request of waitingRequests) {
    if (request.status !== "active") {
      continue;
    }

    for (const slot of doctorSchedule) {
      if (isSlotMatching(request, slot)) {
        matches.push({
          requestId: request.id,
          userId: request.userId,
          slot: slot,
        });
      }
    }
  }

  res.json(matches);
});


// ============================
// Конкретная заявка
// ============================

app.get("/api/waiting-requests/:id", (req, res) => {
  const requestId = Number(req.params.id);

  const waitingRequest = waitingRequests.find(
    (request) => request.id === requestId
  );

  if (!waitingRequest) {
    return res.status(404).json({
      error: "Waiting request not found",
    });
  }

  res.json(waitingRequest);
});


// ============================
// Отмена ожидания
// ============================

app.patch("/api/waiting-requests/:id/cancel", (req, res) => {
  const requestId = Number(req.params.id);

  const waitingRequest = waitingRequests.find(
    (request) => request.id === requestId
  );

  if (!waitingRequest) {
    return res.status(404).json({
      error: "Waiting request not found",
    });
  }

  waitingRequest.status = "cancelled";

  res.json(waitingRequest);
});


// ============================
// Проверка совпадений
// ============================

app.post("/api/check-matches", async (req, res) => {
  const notifications = [];

  for (const request of waitingRequests) {
    if (request.status !== "active") {
      continue;
    }

    for (const slot of doctorSchedule) {
      if (isSlotMatching(request, slot)) {
        const match = {
          requestId: request.id,
          userId: request.userId,
          slot: slot,
        };

        const notification = createMatchNotification(match);

        notifications.push(notification);

        await sendNotificationToBot(notification);
      }
    }
  }

  res.json({
    found: notifications.length,
    notifications: notifications,
  });
});


// ============================
// Добавление нового слота
// ============================

app.post("/api/schedule", async (req, res) => {
  const {
    doctorId,
    doctorName,
    specialty,
    date,
    weekday,
    time,
  } = req.body;

  const newSlot = {
    id: doctorSchedule.length + 1,
    doctorId,
    doctorName,
    specialty,
    date,
    weekday,
    time,
    available: true,
  };

  doctorSchedule.push(newSlot);

  const matches = [];

  for (const request of waitingRequests) {
    if (request.status !== "active") {
      continue;
    }

    if (isSlotMatching(request, newSlot)) {
      const match = {
        requestId: request.id,
        userId: request.userId,
        slot: newSlot,
      };

      const notification = createMatchNotification(match);

      matches.push(notification);

      await sendNotificationToBot(notification);
    }
  }

  res.status(201).json({
    slot: newSlot,
    matchesFound: matches.length,
    notifications: matches,
  });
});


// ============================
// Ожидания пользователя
// ============================

app.get("/api/users/:userId/waiting", (req, res) => {
  const userId = req.params.userId;

  const requests = waitingRequests.filter(
    (request) => request.userId === userId
  );

  res.json(requests);
});


// ============================
// Найденные записи пользователя
// ============================

app.get("/api/users/:userId/matches", (req, res) => {
  const userId = req.params.userId;

  const matches = [];

  for (const request of waitingRequests) {
    if (
      request.userId !== userId ||
      request.status !== "active"
    ) {
      continue;
    }

    for (const slot of doctorSchedule) {
      if (isSlotMatching(request, slot)) {
        matches.push({
          doctorName: slot.doctorName,
          specialty: slot.specialty,
          date: slot.date,
          time: slot.time,
        });
      }
    }
  }

  res.json(matches);
});


// ============================
// Статус ожидания
// ============================

app.get("/api/waiting-requests/:id/status", (req, res) => {
  const id = Number(req.params.id);

  const request = waitingRequests.find(
    (item) => item.id === id
  );

  if (!request) {
    return res.status(404).json({
      error: "Request not found",
    });
  }

  res.json({
    id: request.id,
    status: request.status,
  });
});


// ============================
// Запуск сервера
// ============================

app.listen(PORT, () => {
  console.log(
    `Server started on http://localhost:${PORT}`
  );
});
const express = require("express");
const waitingRequests = require("./data/waitingRequests");
const doctorSchedule = require("./data/doctorSchedule");
const { isSlotMatching } = require("./services/matchingEngine");
const { notifyBot } = require("./services/notificationService");
const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "MAX backend is running",
  });
});
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
    timeTo
  } = req.body;

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
    createdAt: new Date().toISOString()
  };

  waitingRequests.push(newRequest);

  res.status(201).json(newRequest);
});
app.get("/api/schedule", (req, res) => {
  res.json(doctorSchedule);
});
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
          slot: slot
        });
      }
    }
  }

  res.json(matches);
});
//Получить конкретную заявку
app.get("/api/waiting-requests/:id", (req, res) => {
  const requestId = Number(req.params.id);

  const waitingRequest = waitingRequests.find(
    (request) => request.id === requestId
  );

  if (!waitingRequest) {
    return res.status(404).json({
      error: "Waiting request not found"
    });
  }

  res.json(waitingRequest);
});
//Отменить ожидание
app.patch("/api/waiting-requests/:id/cancel", (req, res) => {
  const requestId = Number(req.params.id);

  const waitingRequest = waitingRequests.find(
    (request) => request.id === requestId
  );

  if (!waitingRequest) {
    return res.status(404).json({
      error: "Waiting request not found"
    });
  }

  waitingRequest.status = "cancelled";

  res.json(waitingRequest);
});
//Тестовый эндпоинт
app.post("/api/check-matches", (req, res) => {
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
          slot: slot
        };

        const notification = notifyBot(match);
        notifications.push(notification);
      }
    }
  }

  res.json({
    found: notifications.length,
    notifications: notifications
  });
});
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
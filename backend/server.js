const express = require("express");
const waitingRequests = require("./data/waitingRequests");
const doctorSchedule = require("./data/doctorSchedule");
const { isSlotMatching } = require("./services/matchingEngine");
const { createMatchNotification } = require("./services/notificationService");
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
  if (!userId) {
    return res.status(400).json({
      error: "userId is required"
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

        const notification = createMatchNotification(match);
        notifications.push(notification);
      }
    }
  }

  res.json({
    found: notifications.length,
    notifications: notifications
  });
});
app.post("/api/schedule", (req, res) => {
  const {
    doctorId,
    doctorName,
    specialty,
    date,
    weekday,
    time
  } = req.body;

  const newSlot = {
    id: doctorSchedule.length + 1,
    doctorId,
    doctorName,
    specialty,
    date,
    weekday,
    time,
    available: true
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
        slot: newSlot
      };

      const notification = createMatchNotification(match);

      matches.push(notification);
    }
  }

  res.status(201).json({
    slot: newSlot,
    matchesFound: matches.length,
    notifications: matches
  });
});
//Получение ожидания пользователя
app.get("/api/users/:userId/waiting", (req, res) => {
  const userId = req.params.userId;

  const requests = waitingRequests.filter(
    (request) => request.userId === userId
  );

  res.json(requests);
});
//Получить найденные записи пользователя
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
          time: slot.time
        });

      }
    }
  }

  res.json(matches);
});
app.get("/api/waiting-requests/:id/status", (req, res) => {

  const id = Number(req.params.id);

  const request = waitingRequests.find(
    (item) => item.id === id
  );


  if (!request) {
    return res.status(404).json({
      error: "Request not found"
    });
  }


  res.json({
    id: request.id,
    status: request.status
  });

});
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
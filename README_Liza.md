# MAX Bot Integration

## Branch

Current branch:

```
liza
```

## Module

MAX Bot integration and user notification system.

Responsible part:
- MAX chatbot;
- user identification;
- user storage;
- notification sending.

---

# Description

This module is responsible for communication between users and the MAX chatbot in the doctor appointment waiting system.

The bot allows users to:
- start interaction with the service;
- create a waiting request;
- save user information;
- receive notifications when a suitable appointment slot is found.

---

# Implemented functionality

## MAX Bot

Implemented:

- MAX Bot API connection;
- bot launch using Node.js;
- `/start` command processing;
- welcome message;
- inline button:

```
🔎 Ждать свободное окно
```

---

# User identification

After user interaction, the bot receives MAX user information.

User identifier:

```javascript
ctx.user.user_id
```

Example:

```json
{
  "userId": 24329769,
  "name": "Елизавета"
}
```

This identifier is used for sending personal notifications.

---

# User storage

Users are stored locally in:

```
users.json
```

Example:

```json
[
  {
    "userId": 24329769,
    "name": "Елизавета"
  }
]
```

Storage logic is located in:

```
users.js
```

Functions:

```javascript
saveUser()
getUsers()
```

---

# Notification system

Notification logic is separated into:

```
notifications.js
```

Main function:

```javascript
notifyUser(userId, slot)
```

Function parameters:

```javascript
userId
```

MAX user identifier.

```javascript
slot
```

Information about found appointment.

Example:

```json
{
  "specialty": "Терапевт",
  "date": "21 сентября",
  "time": "14:30"
}
```

Result:

The user receives a notification in MAX.

Example:

```
🎉 Нашлось свободное окно!

👨‍⚕️ Специальность: Терапевт
📅 Дата: 21 сентября
🕐 Время: 14:30

Открой приложение, чтобы посмотреть запись.
```

---

# Testing

For testing the notification system, the bot has a command:

```
/testslot
```

This command simulates the situation when backend finds a suitable appointment slot.

Flow:

```
/testslot

↓

notifyUser()

↓

MAX Bot API

↓

User receives notification
```

---

# Project files

```
bot.js
```

Main MAX bot file.

```
notifications.js
```

Notification sending module.

```
users.js
```

User storage module.

```
users.json
```

Local user storage.

```
README_LIZA.md
```

Documentation for MAX Bot module.

---

# Running the project

Install dependencies:

```bash
npm install
```

Run bot:

```bash
node --use-system-ca bot.js
```

---

# Environment variables

Create:

```
.env
```

with:

```env
MAX_BOT_TOKEN=your_token
```

---

# Backend integration

Current implementation is ready for backend connection.

Expected future flow:

```
Backend matching engine

↓

Suitable appointment slot found

↓

Send userId + slot data

↓

notifyUser()

↓

MAX Bot API

↓

User receives notification
```

---

# Status

Completed:

✅ MAX bot connection  
✅ User interaction  
✅ User identification  
✅ User storage  
✅ Notification system  
✅ Test notification flow  

Branch:

```
liza
```
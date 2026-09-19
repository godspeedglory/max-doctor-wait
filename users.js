const fs = require('fs');

const FILE = './users.json';


function getUsers() {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, '[]');
  }

  return JSON.parse(
    fs.readFileSync(FILE, 'utf8')
  );
}


function saveUser(user) {

  const users = getUsers();

  const exists = users.find(
    item => item.userId === user.userId
  );

  if (!exists) {
    users.push(user);

    fs.writeFileSync(
      FILE,
      JSON.stringify(users, null, 2)
    );

    console.log(
      `✅ Пользователь ${user.userId} сохранён`
    );
  }
}


module.exports = {
  saveUser,
  getUsers
};
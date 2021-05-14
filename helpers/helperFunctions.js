const bcrypt = require('bcrypt');
const saltRounds = 10;
//returns a string of 6 random alphanumeric characters
function generateRandomString() {
  const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const length = 6;
  for ( let i = 0; i < length; i++ ) {
      result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return result;
}

//get a user with email
const getUserByEmail = (email, users) =>{
  for (const key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
  return undefined;
}

//authenticate a user
const authenticateUser = (useParams, users) => {
  const { email, password } = useParams;
  for (let key in users){
    if (users[key].email === email){
        if (bcrypt.compareSync(password, users[key].password)) {
        return {data: users[key], error: null};
      }
      return {data: null, error: "wrong password"};
    }
  }
  return { data: null, error: "bad email" }
}

//function to get urls for a specific user
const urlsForUser = (id, urlDatabase) => {
  let userUrl = {};
  for (let key in urlDatabase ) {
    if (urlDatabase[key].userID === id) {
      userUrl[key] = urlDatabase[key]; 
    }
  }
  return userUrl;
}

//function to get a user by session_id
const getUserById = (id, users) =>{
  for (const key in users) {
    if (key === id) {
      return users[key];
    }
  }
}
module.exports = {generateRandomString, getUserByEmail, authenticateUser, urlsForUser, getUserById}
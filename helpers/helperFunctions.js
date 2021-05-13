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

//fetchUser function
const fetchUser = (email, users) =>{
  for (const key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
}

//authenticate a user
const authenticateUser = (useParams, users) => {
  const { email, password } = useParams;
  for (let key in users){
    console.log(users[key].password);
    if (users[key].email === email){
      console.log(users[key].email);
      //if(users[key].password === password) {//if (user && bcrypt.compareSync(password, user.password)) 
        if (bcrypt.compareSync(password, users[key].password)) {
        return {data: users[key], error: null};
      }
      return {data: null, error: "wrong password"};
    }
  }
  return { data: null, error: "bad email" }
}

module.exports = {generateRandomString, fetchUser, authenticateUser}
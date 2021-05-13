const express = require("express");
const {generateRandomString, fetchUser, authenticateUser} = require("./helpers/helperFunctions");
const app = express();
const PORT = 8080; // default port 8080

//set ejs as the view engine
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser"); 
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));


//URL Database
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };
// const urlDatabase = {
//   b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
//   i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
// };
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};



//User database
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "abcd"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

// //returns a string of 6 random alphanumeric characters
// function generateRandomString() {
//   const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   let result = '';
//   const length = 6;
//   for ( let i = 0; i < length; i++ ) {
//       result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
//   }
//   return result;
// }


app.get("/urls", (req, res) => {
  let userId = req.cookies["user_id"];
  //display a message or prompt suggesting that they log in or register first if the user is not logged in
  if(!userId) {
    res.send("Please login or register first");
  }
  const templateVars = { user: users[userId], urls: urlDatabase};
  res.render("urls_index", templateVars);
});

//route for a new URL
app.get("/urls/new", (req, res) => {
  let userId = req.cookies["user_id"];
  if (!userId){
    res.redirect("/login");
  }
  const templateVars = { user: users[userId]};
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = {longURL: longURL, userID: req.cookies["user_id"]};
  console.log("urlDatabase:", urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

//redirect to long url through shortURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  //edge case
  if(longURL){
    res.redirect(longURL);
  } 
  else {
    res.redirect('/urls');
  }
});

//route for the shortURL
app.get("/urls/:shortURL", (req, res) => {
  let userId = req.cookies["user_id"];
  //const templateVars = { user: users[userId], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]/* What goes here? */ };
  const templateVars = { user: users[userId], shortURL: req.params.shortURL, urls: urlDatabase/* What goes here? */ };

  res.render("urls_show", templateVars);
});

//Delete Route
app.post("/urls/:shortURL/delete", (req, res) => {
//extract the url form req.params
const {shortURL} = req.params;
console.log(req.params);
//delete the targeted url
delete urlDatabase[shortURL];
//redirect
res.redirect("/urls");
});

//Update
//display the urls_show page
app.post("/urls/:shortURL/update", (req, res) =>{
  //extract short url from req.params
  const { shortURL } = req.params;
  //extract the updated longURL from req.body
  const {shortURLContent} = req.body;
  //update the value inside the object
  urlDatabase[shortURL] =shortURLContent;
  res.redirect("/urls");

});

//Logout route
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});



//register route
//show the registration form
app.get("/register", (req,res) => {
  const templateVars = {
    user: null,
  }
  res.render("register_form",templateVars);
});

//fetchUser function
// const fetchUser = (email) =>{
//   for (const key in users) {
//     if (users[key].email === email) {
//       return users[key];
//     }
//   }
// }


//register a new user
app.post("/register", (req,res) => {
  const { email, password } = req.body;
  if(fetchUser(email, users)){
    return res.status(400).send('User already exists');
  }
  if (!email || !password) {
    return res.status(400).send('Invalid fields');
  }
  const userId = generateRandomString();
  const newUser = {id : userId, email : email, password : password};
  //console.log("newUser",newUser);
  users[userId] = newUser;
  console.log("userdb",users);
  res.cookie('user_id', userId);
  res.redirect("/urls");
});

//show the login form
app.get("/login", (req, res) => {
  const templateVars = {
    user: null,
  }
  res.render("login_form", templateVars);
});

// const authenticateUser = (useParams) => {
//   const { email, password } = useParams;
//   for (let key in users){
//     console.log(users[key].password);
//     if (users[key].email === email){
//       console.log(users[key].email);
//       if(users[key].password === password) {
//         return {data: users[key], error: null};
//       }
//       return {data: null, error: "wrong password"};
//     }
//   }
//   return { data: null, error: "bad email" }
// }
//login a user
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  //If a user with that e-mail cannot be found, return a response with a 403 status code.
  if(!fetchUser(email, users)) {
    res.status(403).send("This user is not registered");
  }
  //If a user with that e-mail address is located,
  // compare the password given in the form with the existing user's password.
  // If it does not match, return a response with a 403 status code.
  const result = authenticateUser(req.body, users);
  if(result.error) {
    return res.status(403).send("wrong passwrod");
  }
  //If both checks pass, set the user_id cookie with the matching user's random ID, then redirect to /urls.
  res.cookie('user_id', result.data.id);
  return res.redirect("/urls")
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
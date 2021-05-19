const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const {generateRandomString, getUserByEmail, authenticateUser, urlsForUser, getUserById} = require("./helpers/helperFunctions");
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const PORT = 8080; // default port 8080

//set ejs as the view engine
app.set("view engine", "ejs");


app.use(bodyParser.urlencoded({extended: true}));

// Cookie Session Middleware
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

//ursl database
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};

//User database
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync('abc', saltRounds) 
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync('hello', saltRounds)
  }
}

//route for Get /
app.get("/", (req, res) =>{
  //if a user is logged in, redirect to /urls
  if(req.session['user_id']) {
    res.redirect("/urls");
  } else {//if a user is not logged in
    res.redirect("/login");
  }
});

//get the urls
app.get("/urls", (req, res) => {
  let currentUser = getUserById(req.session['user_id'], users);
 //if a user is not logged in
 if(!currentUser) {
   res.send('<p3><a href="/login">Please login here</a></p3>');
 } else {
   const templateVars = { user: currentUser, urls: urlsForUser(req.session['user_id'], urlDatabase)};
   res.render("urls_index", templateVars);
 }
  
});


//route for a new URL
app.get("/urls/new", (req, res) => {
  let userId = req.session['user_id'];
  if (!userId){
    res.redirect("/login");
  }
  const templateVars = { user: users[userId]};
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session['user_id']) {
    return res.send('<h3><a href="/login">log in first please</a></h3>');
  }
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = {longURL: longURL, userID: req.session['user_id']};
  res.redirect('/urls');
});


//route redirect to long url through shortURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  //edge case
  if(longURL){
    res.redirect(longURL);
  } 
});

//route for the shortURL
app.get("/urls/:shortURL", (req, res) => {
  let userId = req.session['user_id'];
  //if user tries to visit this route while the user is not logged in
  if (!userId) {
    return res.send('<h3><a href="/login">log in first please</a></h3>');
  }
  //fetch the urls for a user
  const urls = urlsForUser(req.session['user_id'], urlDatabase);
  //check if the user owns the urls to update
  const isUsers = urlDatabase[req.params.shortURL] && urlDatabase[req.params.shortURL].userID === userId; 
  if (isUsers) {
    const templateVars = { user: users[userId], shortURL: req.params.shortURL, urls: urlDatabase};
  res.render("urls_show", templateVars);
  } else {
    return res.send('<h3>You do not own this URL</h3><a href="/urls">Go back to urls page</a>');
  }
});

//Delete Route
app.post("/urls/:shortURL/delete", (req, res) => {
  let currentUser = getUserById(req.session['user_id'], users)
//extract the url form req.params
const {shortURL} = req.params;
//delete the targeted url
if(!currentUser) {
  res.send("This is not your account");
} else {
  delete urlDatabase[shortURL];
  //redirect
  res.redirect("/urls");
}
});


//Update routes
//display the urls_show page
app.post("/urls/:shortURL/update", (req, res) =>{
  let currentUser = getUserById(req.session['user_id'], users)
  //extract short url from req.params
  const { shortURL } = req.params;
  //extract the updated longURL from req.body
  const {shortURLContent} = req.body;
  //update the value inside the object
  if(!currentUser) {
    res.send("this is not your account");
  } else {
    urlDatabase[shortURL] = {longURL: shortURLContent, userID: req.session['user_id']};
  res.redirect("/urls");
  }
  

});

//Logout route
app.post("/logout", (req, res) => {
  req.session['user_id'] = null;
  res.redirect("/login");
});



//register route
//show the registration form
app.get("/register", (req,res) => {
  const templateVars = {
    user: null,
  }
  res.render("register_form",templateVars);
});

//register a new user
app.post("/register", (req,res) => {
  const { email, password } = req.body;
  //if a user already exists
  if(getUserByEmail(email, users)){
    return res.status(400).send('User already exists');
  }
  //if email or password is empty
  if (!email || !password) {
    return res.status(400).send('Invalid fields');
  }
  //bcrypt the password
  const hashedPassword = bcrypt.hashSync(password, saltRounds);
  //add the user the to databse
  const userId = generateRandomString();
  const newUser = {id : userId, email : email, password : hashedPassword};
  users[userId] = newUser;
  req.session['user_id'] = userId;
  res.redirect("/urls");
});

//routes for login
app.get("/login", (req, res) => {
  const templateVars = {
    user: null,
  }
  res.render("login_form", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  //If a user with that e-mail cannot be found, return a response with a 403 status code.
  if(!getUserByEmail(email, users)) {
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
  //setCookie with the user id
  req.session['user_id'] = result.data.id;
  return res.redirect("/urls")
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
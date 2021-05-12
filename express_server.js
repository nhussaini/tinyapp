const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

//set ejs as the view engine
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser"); 
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

app.get("/urls", (req, res) => {
  const templateVars = { username: req.cookies["username"], urls: urlDatabase};
  res.render("urls_index", templateVars);
});

//route for a new URL
app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"]};
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  //console.log(shortURL);
  let longURL = req.body.longURL;
  //console.log(longURL);
  urlDatabase[shortURL] = longURL;
  
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

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { username: req.cookies["username"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]/* What goes here? */ };
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

//handle login
app.post("/login", (req, res) =>{
  //console.log(req.body);
  const { username } = req.body;
  //console.log(username);
  //set the cookie name username
  res.cookie('username', username);
  //redirect to the /urls
  res.redirect("/urls")
});

//Logout route
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

//register route
//show the registration form
app.get("/register", (req,res) => {
  res.render("register_form");
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
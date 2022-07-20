const express = require("express");
const bodyParser = require("body-parser");

//routes
const twitchController = require("./twitch/controllers/index");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/twitch", twitchController);

app.use((req, res, next) => {
  response = {
    error: true,
    code: 404,
    message: "Resource Not Found",
  };
  res.status(response.code).send(response);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

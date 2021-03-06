"use strict";

let express = require("express");
let app = express();
let bodyParser = require("body-parser");
const axios = require("axios");

// These two following lines ensures that every incomming request is parsed to json automatically
app.use(bodyParser.urlencoded({ extended: "true" }));
app.use(bodyParser.json());
// Allowing access to resources from anywhere
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/", (req, res) => {
  let response = {};
  const intentName = req.body.queryResult.intent.displayName;

  if (intentName === "hello") {
    response = {
      fulfillmentText: "Hello"
    };
  }

  res.json(response);
});

app.get("/health", (req, res) => {
  res.send("ok prod");
});

app.post("/health", (req, res) => {
  if (req.body.queryResult.parameters.date) {
    const date = new Date(req.body.queryResult.parameters.date);
    retrieveLessons(
      date.getDate(),
      date.getMonth() + 1,
      date.getFullYear()
    ).then(lessons => {
      const response = { fulfillmentText: lessons };
      res.send(response);
    });
  } else {
    const response = { fulfillmentText: "Je n'ai pas compris la date" };
    res.send(response);
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);
console.log("info", `server listening on port ${port}`);

const retrieveLessons = (day, month, year) =>
  axios
    .get(
      `https://www.iiens.net/etudiants/edt/json_services/events.php?${year}/${month}/${day}-1-`
    )
    .then(response => {
      const eventgroups = response.data.eventgroups;
      const lessons = [];
      for (let key in eventgroups) {
        if (eventgroups[key].events.e1) {
          const e = eventgroups[key].events.e1;

          lessons.push(formatLessonTitle(e.title, e.start, e.duration));
        }
      }
      return lessons.join("\n");
    })
    .catch(error => {
      console.log(error);
    });

const formatLessonTitle = (title, start, duration) =>
  `De ${retrieveTimeFromQuarters(start)} à ${retrieveTimeFromQuarters(
    start + duration
  )}, tu as ${title}`;

const retrieveTimeFromQuarters = quarter => {
  const hours = Math.trunc(quarter / 4);
  let minutes;
  switch (quarter % 4) {
    case 1:
      minutes = "15";
      break;
    case 2:
      minutes = "30";
      break;
    case 3:
      minutes = "45";
      break;
    default:
      minutes = "00";
  }
  return `${hours}H${minutes}`;
};

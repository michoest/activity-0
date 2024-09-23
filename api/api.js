// api.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const dayjs = require('dayjs');

const { initDatabase, getDb, getDbCollections } = require("./db/db");
const { asyncWrapper, APIError } = require('./utils/utils');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors("*"));
app.use(express.json());
app.use(morgan("combined"));

async function startApp() {
  await initDatabase();
  console.log("Database initialized, starting server...");
  startServer();
}

startApp();

function startServer() {
  // Session middleware
  app.use((req, res, next) => {
    req.session = req.headers["session"];

    next();
  });

  // Ping route
  app.get("/ping", async (req, res, next) => {
    res.send("pong");
  });

  // Activity routes
  app.get("/activities", asyncWrapper(async (req, res, next) => {
    const { Activities } = getDbCollections();

    const activities = Activities.find();
    return res.json({ activities });
  }));

  app.put('/activity/:id', asyncWrapper(async (req, res, next) => {
    const { Activities } = getDbCollections();

    const activity = Activities.findOne({ id: req.params.id });

    if (activity) {
        console.log(activity);
        activity.scans.push({ date: dayjs(), type: req.query.type });

        if (activity.status == 'not_started') {
            activity.status = 'in_progress';
            activity.occurrences.push({ start: dayjs() });
        }
        else {
            activity.status = 'not_started';
            activity.occurrences[activity.occurrences.length - 1].end = dayjs();
        }
        Activities.update(activity);

        // Stop any other running activity
        let activities = Activities.find();
        
        activities.forEach(otherActivity => {
            if (otherActivity.id != activity.id) {
                if (otherActivity.status == 'in_progress') {
                    otherActivity.status = 'not_started';
                    otherActivity.occurrences[otherActivity.occurrences.length - 1].end = dayjs();
    
                    Activities.update(otherActivity);
                }
            }
        });
        
        activities = Activities.find();
        return res.json({ activities });
    }
    else {
        throw new APIError('Invalid activity!');
    }
  }));

  // Test routes
  app.get("/test", async (req, res, next) => {
    res.json();
  });

  // Error handling with APIError
  app.use(function (err, req, res, next) {
    const statusCode = err.statusCode || 500;
    console.error(err.message, err.stack);

    return res.status(statusCode).json({
      success: false,
      notification: { message: err.message },
      ...err.info,
    });
  });

  // Start the server
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  // Handle server shutdown
  process.on("SIGINT", () => {
    console.log("Server is shutting down...");
    getDb().close(() => {
      console.log("Database closed.");
      server.close(() => {
        console.log("Server closed.");
        process.exit(0);
      });
    });
  });
}

module.exports = app;

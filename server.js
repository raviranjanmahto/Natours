const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");
process.on("uncaughtException", err => {
  const error = Object.create(err);
  console.log("UNCAUGHT EXCEPTION!💥💥💥🙄💥💥💥 Shutting down... ");
  console.log(error.name, error.message);
  const now = new Date(Date.now());
  fs.appendFileSync("./log.txt", `${now.toUTCString()} - ${err}\n`, "utf-8");
  process.exit(1);
});
const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const dns = require("dns");
const morgan = require("morgan");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const mongoose = require("mongoose");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");

const app = express();

// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit request from same API
const apiLimiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: {
    status: "fail",
    message: "Too amy request from this IP, please try again in a hour",
  },
});

app.use("/api", apiLimiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingQuantity",
      "ratingAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

// Serving static file
app.use(express.static(`${__dirname}/public`));

// Checking internet connection
app.use((req, res, next) => {
  dns.lookup("google.com", err => {
    if (err && err.code == "ENOTFOUND") {
      res
        .status(503)
        .json({ status: "fail", message: "No internet connection" });
    } else {
      next();
    }
  });
});

// Test middleware
app.use((req, res, next) => {
  console.log("Hello from the middleware🥰");
  next();
});

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

// DATABASE CONNECTION
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
  })
  .then(() => console.log("Database connected successfully🥰"))
  .catch(err => console.log("Error connecting to database🙄", err));

// 4) START SERVER
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

process.on("unhandledRejection", err => {
  console.log("UNHANDLER REJECTION!💥💥💥🙄💥💥💥 Shutting down... ");
  console.log(err.name, err.message);
  const now = new Date(Date.now());
  fs.appendFileSync("./log.txt", `${now.toUTCString()} - ${err}\n`, "utf-8");
  server.close(() => {
    process.exit(1);
  });
});

// console.log(x);

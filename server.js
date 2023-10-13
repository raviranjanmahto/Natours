const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");
process.on("uncaughtException", err => {
  const error = Object.create(err);
  console.log("UNCAUGHT EXCEPTION!💥💥💥🙄💥💥💥 Shutting down... ");
  console.log(error.name, error.message);
  const now = new Date(Date.now());
  if (process.env.NODE_ENV === "development")
    fs.appendFileSync("./log.txt", `${now.toUTCString()} - ${err}\n`, "utf-8");
  process.exit(1);
});
const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");

const morgan = require("morgan");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const mongoose = require("mongoose");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const viewRouter = require("./routes/viewRoutes");

const app = express();
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// 1) GLOBAL MIDDLEWARES

// Serving static file
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, "public")));

// Set security HTTP headers
app.use(helmet());

// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = ["https://unpkg.com/", "https://tile.openstreetmap.org"];
const styleSrcUrls = [
  "https://unpkg.com/",
  "https://tile.openstreetmap.org",
  "https://fonts.googleapis.com/",
];
const connectSrcUrls = ["https://unpkg.com", "https://tile.openstreetmap.org"];
const fontSrcUrls = ["fonts.googleapis.com", "fonts.gstatic.com"];

//set security http headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: ["'self'", "blob:", "data:", "https:"],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

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

// Parses the data from cookies
app.use(cookieParser());

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

app.use(compression());

// Test middleware
// app.use((req, res, next) => {
//   console.log("Hello from the middleware🥰");
//   // console.log(req.cookies);
//   next();
// });

app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

// DATABASE CONNECTION
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
  })
  .then(() => console.log("Database connected successfully🥰💚🥰"))
  .catch(err => console.log("Error connecting to database🙄💥🙄", err.message));

// 4) START SERVER
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

process.on("unhandledRejection", err => {
  console.log("UNHANDLER REJECTION!💥💥💥🙄💥💥💥 Shutting down... ");
  console.log(err.name, err.message);
  const now = new Date(Date.now());
  if (process.env.NODE_ENV === "development")
    fs.appendFileSync("./log.txt", `${now.toUTCString()} - ${err}\n`, "utf-8");
  server.close(() => {
    process.exit(1);
  });
});

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
const dns = require("dns");
const morgan = require("morgan");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const mongoose = require("mongoose");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

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

app.use((req, res, next) => {
  console.log("Hello from the middleware🥰");
  next();
});

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

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

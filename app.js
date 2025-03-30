const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const { errorResponse } = require("./Response/response");
const userRouter = require("./Routes/userRouts");
const postRouter = require("./Routes/postRoute");
const messageRouter = require("./Routes/messageRoute");

const app = express();

// ✅ Apply Middleware (CORS, Cookie, JSON)
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ✅ API Routes
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/message", messageRouter);

// ✅ Test Route
app.get("/", (req, res, next) => {
  res.send("Hello World!");
});

// ❌ Handle Undefined Routes
app.use((req, res, next) => {
  next(createError(404, "Route not found"));
});

// ❌ Error Handling Middleware
app.use((err, req, res, next) => {
  errorResponse(res, {
    statusCode: err.statusCode || 500,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;

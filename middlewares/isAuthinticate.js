const jwt = require("jsonwebtoken");
const createError = require("http-errors");

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw createError.Unauthorized("please login first");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded) {
      throw createError.Unauthorized("please login");
    }
    req.id = decoded.userId;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = isAuthenticated
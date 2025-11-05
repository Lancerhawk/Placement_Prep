const jwt = require('jsonwebtoken');

module.exports = function auth(req, _res, next) {
  const token = req.cookies?.token;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
  } catch (_e) {
    // invalid token -> ignore, req.user stays undefined
  }
  next();
};



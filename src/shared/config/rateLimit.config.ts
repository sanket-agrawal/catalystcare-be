import dotenv from "dotenv";
dotenv.config();

export const rateLimitConfig = {
  global: {
    windowMs: parseInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS || "") || 15 * 60 * 1000, // 15 mins
    limit: parseInt(process.env.RATE_LIMIT_GLOBAL_LIMIT || "") || 150,
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
  auth: {
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || "") || 15 * 60 * 1000, // 15 mins
    limit: parseInt(process.env.RATE_LIMIT_AUTH_LIMIT || "") || 10,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
  ai: {
    windowMs: parseInt(process.env.RATE_LIMIT_AI_WINDOW_MS || "") || 15 * 60 * 1000, // 15 mins
    limit: parseInt(process.env.RATE_LIMIT_AI_LIMIT || "") || 20,
    message: "Too many AI request attempts. Please try again after 15 minutes.",
  },
  upload: {
    windowMs: parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS || "") || 15 * 60 * 1000, // 15 mins
    limit: parseInt(process.env.RATE_LIMIT_UPLOAD_LIMIT || "") || 15,
    message: "Too many file upload attempts. Please try again after 15 minutes.",
  },
};

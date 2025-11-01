import dotenv from 'dotenv';
dotenv.config();

export const serverConfig = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  baseFrontendUrl : "https://www.catalystcare.in"
};
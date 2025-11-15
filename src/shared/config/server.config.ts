import dotenv from 'dotenv';
dotenv.config();

export const serverConfig = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  baseFrontendUrl : "https://www.catalystcare.in",
  superAdminEmail : process.env.SUPER_ADMIN_EMAIL as string,
};

export const dataKeys = {
  DATA_KEY_V1 : process.env.DATA_KEY_V1!
}
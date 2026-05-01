import dotenv from 'dotenv';
dotenv.config();

export const serverConfig = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  baseFrontendUrl : process.env.FRONTEND_BASE_URL as string,
  superAdminEmail : process.env.SUPER_ADMIN_EMAIL as string,
};

export const dataKeys = {
  DATA_KEY_V1 : process.env.DATA_KEY_V1!
}

// export const serverTempConfig =  {
//   port: process.env.PORT || 4000,
//   nodeEnv: process.env.NODE_ENV || 'development',
//   baseFrontendUrl : "http://localhost:3000",
//   superAdminEmail : process.env.SUPER_ADMIN_EMAIL as string,
// }
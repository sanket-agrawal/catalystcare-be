import type { SignOptions } from "jsonwebtoken";

export const tokenConfig = {
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY as unknown as SignOptions["expiresIn"],
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY as string,
};

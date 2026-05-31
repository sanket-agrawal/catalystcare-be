import { randomUUID } from "crypto";
import { Response } from "express";
import { prisma } from "../../infrastructure/prisma/client";

// const REFRESH_TOKEN_EXPIRY_DAYS = 15;
const REFRESH_TOKEN_EXPIRY_MINUTES = 10;

/**
 * Generate a refresh token, store it in the database, and return the raw token string.
 */
export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = randomUUID();
  const expiresAt = new Date();
  // expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  expiresAt.setMinutes(expiresAt.getMinutes() + REFRESH_TOKEN_EXPIRY_MINUTES);

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
};

/**
 * Validate a refresh token and rotate it (delete old, create new).
 * Returns the userId if valid, throws otherwise.
 */
export const validateAndRotateRefreshToken = async (
  token: string
): Promise<{ userId: string; newToken: string }> => {
  const existing = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!existing) {
    throw new Error("Invalid refresh token");
  }

  if (existing.expiresAt < new Date()) {
    // Clean up expired token
    await prisma.refreshToken.delete({ where: { id: existing.id } });
    throw new Error("Refresh token expired");
  }

  // Rotate: delete old token and create a new one
  const newToken = randomUUID();
  const expiresAt = new Date();
  // expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  expiresAt.setMinutes(expiresAt.getMinutes() + REFRESH_TOKEN_EXPIRY_MINUTES);

  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: existing.id } }),
    prisma.refreshToken.create({
      data: {
        token: newToken,
        userId: existing.userId,
        expiresAt,
      },
    }),
  ]);

  return { userId: existing.userId, newToken };
};

/**
 * Revoke all refresh tokens for a user (used on logout, password reset, etc.)
 */
export const revokeAllUserRefreshTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
};

/**
 * Revoke a single refresh token (used on single-device logout).
 */
export const revokeSingleRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { token },
  });
};

/**
 * Set the refresh token as an HTTP-only cookie on the response.
 */
export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    // maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000, // 15 days in ms
    maxAge: REFRESH_TOKEN_EXPIRY_MINUTES * 60 * 1000, // 10 mins in ms
    path: "/",
  });
};

/**
 * Clear the refresh token cookie.
 */
export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
};

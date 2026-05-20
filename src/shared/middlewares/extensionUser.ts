import { NextFunction, Request, Response } from "express";
import { prisma } from "../../infrastructure/prisma/client";
import jwt from "jsonwebtoken"

// middleware/extensionAccess.middleware.ts
export const ensureExtensionAccess = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;

  if (!req.user!.isExtensionUser) {
    // First time hitting extension routes — upgrade silently
    await prisma.user.update({
      where: { id: userId },
      data: {
        isExtensionUser: true,
        accountType: "FULL",
      },
    });

    // Issue a fresh token with updated fields
    // const freshToken = jwt.sign(
    //   {
    //     ...req.user,
    //     isExtensionUser: true
    //   },
    //   process.env.JWT_SECRET as string,
    //   { expiresIn: "7d" }
    // );

    // // Send new token in response header — client stores it
    // res.setHeader("X-Refreshed-Token", freshToken);

    // Also upsert ExtensionUsage
    // await prisma.extensionUsage.upsert({
    //   where: { userId },
    //   create: { userId },
    //   update: {},
    // });
  }

  next();
};
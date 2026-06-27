// import ApiError from "../utils/ApiError";
// import { NextFunction, Request, Response } from "express";
// import { prisma } from "../../infrastructure/prisma/client";

// const FREE_MESSAGE_LIMIT = Number(process.env.EXTENSION_FREE_LIMIT ?? 20);

// const startOfCurrentMonth = (): Date => {
//   const now = new Date();
//   return new Date(now.getFullYear(), now.getMonth(), 1);
// };
 
// /**
//  * Returns the active ExtensionSubscription for a user, or null.
//  * "Active" means status=ACTIVE and currentPeriodEnd is in the future.
//  */
// const getActiveExtensionSubscription = async (userId: string) => {
//   return prisma.extensionSubscription.findFirst({
//     where: {
//       userId,
//       status: "ACTIVE",
//       currentPeriodEnd: { gt: new Date() },
//     },
//     select: {
//       id: true,
//       currentPeriodEnd: true,
//       plan: {
//         select: {
//           name: true,
//           messageLimit: true, // null = unlimited
//         },
//       },
//     },
//   });
// };
 
// /**
//  * Counts user-sent VentMessages this calendar month across all their sessions.
//  */
// const countUserMessagesThisMonth = async (userId: string): Promise<number> => {
//   return prisma.ventMessage.count({
//     where: {
//       role: "user",
//       createdAt: { gte: startOfCurrentMonth() },
//       session: {
//         userId,
//       },
//     },
//   });
// };


// export const checkExtensionLimit = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const userId = (req as any).user?.id as string | undefined;
 
//     if (!userId) {
//       throw new ApiError(401, "Unauthorized");
//     }
 
//     // ── 1. Check for an active paid subscription ──────────────────────────
//     const activeSub = await getActiveExtensionSubscription(userId);
 
//     if (activeSub) {
//       const planLimit = activeSub.plan.messageLimit; // null = unlimited
 
//       if (planLimit !== null) {
//         // Paid plan still has a cap (e.g. a lower-tier paid plan)
//         const used = await countUserMessagesThisMonth(userId);
 
//         if (used >= planLimit) {
//           res.status(402).json({
//             code: "PLAN_LIMIT_REACHED",
//             message: "You have reached the message limit for your current plan.",
//             usedMessages: used,
//             limit: planLimit,
//             isPaid: true,
//             planName: activeSub.plan.name,
//           });
//           return;
//         }
 
//         (req as any).extensionUsage = {
//           used,
//           limit: planLimit,
//           isPaid: true,
//           subscriptionId: activeSub.id,
//         };
//       } else {
//         // Unlimited paid plan — skip counting
//         (req as any).extensionUsage = {
//           used: null,
//           limit: null,
//           isPaid: true,
//           subscriptionId: activeSub.id,
//         };
//       }
 
//       return next();
//     }
 
//     // ── 2. Free tier — count messages this month ──────────────────────────
//     const used = await countUserMessagesThisMonth(userId);
 
//     if (used >= FREE_MESSAGE_LIMIT) {
//       res.status(402).json({
//         code: "PAYWALL",
//         message: "You have reached your free message limit for this month.",
//         usedMessages: used,
//         limit: FREE_MESSAGE_LIMIT,
//         isPaid: false,
//       });
//       return;
//     }
 
//     (req as any).extensionUsage = {
//       used,
//       limit: FREE_MESSAGE_LIMIT,
//       isPaid: false,
//       subscriptionId: null,
//     };
 
//     next();
//   } catch (error) {
//     if (error instanceof ApiError) {
//       res.status(error.statusCode).json({ message: error.message });
//       return;
//     }
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
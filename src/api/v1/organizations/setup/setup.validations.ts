import z from "zod"

export const OrgSetupSchema = z.object({
    body : z.object({
        adminEmail : z.string().email()
    })
});

export const acceptAdminInviteSchema = z.object({
  body: z.object({
    token: z.string().uuid(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    password: z.string().min(8),
  }),
});
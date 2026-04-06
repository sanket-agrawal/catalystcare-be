import z from "zod"

export const OrgSetupSchema = z.object({
    body : z.object({
        adminEmail : z.string().email()
    })
});

export const acceptAdminInviteSchema = z.object({
    body : z.object({
        token : z.string().uuid(),
        userId : z.string().uuid()
    })
})
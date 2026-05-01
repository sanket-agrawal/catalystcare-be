import express from "express";
import multer from "multer";
// import InviteMemberController from "./inviteMembers.controller";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["text/csv", "application/vnd.ms-excel", "text/plain"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

// router.post('/members',InviteMemberController.inviteMembers);
// router.post('/bulk',
//     upload.single("file"),
//     InviteMemberController.bulkInviteMembersWithCSV);

export default router;
import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";

const InviteMemberController = {

    inviteMembers : async (req : Request, res : Response) => {
        try{

        }catch(error){
            console.error("Error inviting members:", error);
                  if (error instanceof ApiError) {
                    return res
                      .status(error.statusCode)
                      .json(new ApiResponse(false, error.statusCode, error.message));
                  }
                  return res
                    .status(500)
                    .json(new ApiResponse(false, 500, "Internal Server Error"));
        }
    },
    bulkInviteMembersWithCSV : async (req : Request, res : Response) => {
        try{

        }catch(error){
            console.error("Error bulk inviting members:", error);
                  if (error instanceof ApiError) {
                    return res
                      .status(error.statusCode)
                      .json(new ApiResponse(false, error.statusCode, error.message));
                  }
                  return res
                    .status(500)
                    .json(new ApiResponse(false, 500, "Internal Server Error"));
        }
    },

};

export default InviteMemberController;
import { connectCalendarService } from "../../../../infrastructure/googleAuth/connectCalendar.service";
import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";

export const googleAuthController = {
    authenticate : async (req : Request, res : Response) => {
        try {
            const url = await connectCalendarService.authenticate(req.user);
            res.redirect(url);
            // res.status(200).json(
            //     new ApiResponse(true,200,"Google Auth URL Generated Successfully",{url})
            // )
        } catch (error) {
            console.log("Google Auth URL Generation Error:",error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(
                    new ApiResponse(false,500,error.message)
                )
            }else{
                res.status(500).json(
                    new ApiResponse(false,500,"Internal Server Error")
                )
            }
        }
    },

    callback: async (req: Request, res: Response) => {
  try {
    const codeParam = req.query.code;
    const stateParam = req.query.state;

    if (typeof codeParam !== "string") {
      throw new ApiError(400, "Invalid or missing ?code in callback URL");
    }

    if (typeof stateParam !== "string") {
      throw new ApiError(400, "Invalid or missing ?state in callback URL");
    }

    const url = await connectCalendarService.callback(codeParam, stateParam);

    res.status(200).json(
      new ApiResponse(true, 200, "Google Calendar Connected Successfully", { url })
    );

  } catch (error) {
    console.log("Google Callback Error:", error);

    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json(new ApiResponse(false, error.statusCode, error.message));
    }

    res
      .status(500)
      .json(new ApiResponse(false, 500, "Internal Server Error"));
  }
}

}
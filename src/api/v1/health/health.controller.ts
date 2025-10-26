import ApiResponse from "../../../shared/utils/ApiResponse";
import { Request, Response } from "express";

export const healthController = {
    async checkHealth(req: Request, res : Response){
        try {
            const response = {
                status : "Healthy",
                upTime : process.uptime(),
                timeStamp : Date.now()
            }
            res.status(200).json(
                new ApiResponse(true,200,"Health Check Performed Successfully",response)
            )
        } catch (error) {
            res.status(500).json(
                new ApiResponse(false,500,(error as Error).message)
            )
        }
    }
}
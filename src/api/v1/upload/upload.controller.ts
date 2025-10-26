import ApiError from "../../../shared/utils/ApiError";
import ApiResponse from "../../../shared/utils/ApiResponse";
import {prisma} from '../../../infrastructure/prisma/client'
import { Request, Response } from "express";
import { uploadFileToS3 } from "../../../infrastructure/aws/s3";

export const uploadFile = async (req : Request, res : Response) => {
    try {
        const userId = req.user.id;
        const docType = req.query.doctype;
        const entity = req.query.entity;
        const file = req.file;

        if (!file || !docType || !entity) {
        return res.status(404).json(
            new ApiResponse(false, 404, "File or docType or entity not provided")
        );
        }

        const key = `${entity}/${userId}/${docType}-${Date.now()}.${file.mimetype.split('/')[1]}`;
        await uploadFileToS3(file.buffer, key, file.mimetype);

        res.status(200).json(
            new ApiResponse(true, 200, "File uploaded successfully", { fileUrl: key })
        );
    } catch (error) {
        console.log("Uploading File :",error);
        if(error instanceof ApiError){
            res.status(error.statusCode).json(
                new ApiResponse(false,error.statusCode,error.message)
            )
        }else{
            res.status(500).json(
                new ApiResponse(false,500,"Internal Server Error")
            )
        }
}
}
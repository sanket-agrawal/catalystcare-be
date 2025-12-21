import { emailFromAddress, emailSubjects } from "../../../shared/config/email.config";
import { emailQueue } from "../../../infrastructure/queues";
import ApiError from "../../../shared/utils/ApiError";
import ApiResponse from "../../../shared/utils/ApiResponse";
import contactModel from "../models/contact";
import { Request, Response } from "express";
import { adminConfig } from "../../../shared/config/admin.config";
import { contactFormAdminTemplate, contactFormClientTemplate } from "../../../shared/email-templates/website";

export const createContact = async (req : Request, res : Response) => {
    try{

        const {name, email, phone , source, message} = req.body;

        if(!name || !email || !message){
            throw new ApiError(400,"Name, Email and Message are required fields");
        }

        const newContact = new contactModel({
            name,
            email,
            phone,
            source,
            message
        });

        await newContact.save();

        await emailQueue.add('sendContactFormSubmissionClientCopy',{
                          to : email,
                          subject :emailSubjects().contactFormSubmissionClientCopy,
                          html : contactFormClientTemplate(name),
                          sender : emailFromAddress().infoEmail
                        });
        await emailQueue.add('sendContactFormSubmissionAdminCopy',{
                          to : adminConfig.email,
                          subject :emailSubjects().contactFormSubmissionAdminCopy,
                          html : contactFormAdminTemplate(name,email,phone,message,source),
                          sender : emailFromAddress().infoEmail
                        });
        res.status(201).json(
            new ApiResponse(true,201,"Contact form submitted successfully",newContact)
        )

    }catch(error){
        console.log("Error creating contact:", error);
        if(error instanceof ApiError){
            res.status(error.statusCode).json(
                new ApiResponse(false,400,error.message)
            )
        }else{
            res.status(500).json(
                new ApiResponse(false,500,"Internal Server Error")
            )
        }
    }
}

export const fetchAllContactFormSubmissions = async (req : Request , res : Response) => {
    try{
        const contacts =  await contactModel.find().sort({createdAt : -1});
        res.status(200).json(
            new ApiResponse(true,200,"Contact submissions fetched successfully",contacts)
        )
    }catch(error){
        console.log("Error fetching contact submissions:", error);
        if(error instanceof ApiError){
            res.status(error.statusCode).json(
                new ApiResponse(false,400,error.message)
            )
        }else{
            res.status(500).json(
                new ApiResponse(false,500,"Internal Server Error")
            )
        }
    }
}
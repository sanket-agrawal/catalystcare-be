import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import { assessmentService } from "./assessment.service";
import { Parser } from "json2csv";
import { formatToIST } from "../../../../shared/lib/date";


export const assessmentController = {
    createAssessment : async (req : Request, res : Response) => {
        try {
            const assessment = await assessmentService.createAssessment(req.body);
            res.status(201).json(
                new ApiResponse(
                    true,
                    201,
                    "Assessment Created Successfully",
                    assessment
                )
            )
        } catch (error) {
            console.log("Error Creating Assessment : ",error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(
                    new ApiResponse(
                        false,
                        error.statusCode,
                        error.message
                    )
                )
            }else{
                res.status(500).json(
                    new ApiResponse(
                        false,
                        500,
                        "Internal Server Error"
                    )
                )
            }
        }
    },
    updateAssessment : async (req : Request, res : Response) => {
        try {
            const { id } = req.params;
            const assessment = await assessmentService.updateAssessment(id, req.body);
            res.status(200).json(
                new ApiResponse(
                    true,
                    200,
                    "Assessment Updated Successfully",
                    assessment
                )
            )
        } catch (error) {
            console.log("Error Updating Assessment : ",error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(
                    new ApiResponse(
                        false,
                        error.statusCode,
                        error.message
                    )
                )
            }else{
                res.status(500).json(
                    new ApiResponse(
                        false,
                        500,
                        "Internal Server Error"
                    )
                )
            }
        }
    },
    publishAssessment : async (req : Request, res : Response) => {
        try {
            const { id } = req.params;
            const assessment = await assessmentService.publishAssessment(id);
            res.status(200).json(
                new ApiResponse(
                    true,
                    200,
                    "Assessment Published Successfully",
                    assessment
                )
            )
        } catch (error) {
            console.log("Error Publishing Assessment : ",error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(
                    new ApiResponse(
                        false,
                        error.statusCode,
                        error.message
                    )
                )
            }else{
                res.status(500).json(
                    new ApiResponse(
                        false,
                        500,
                        "Internal Server Error"
                    )
                )
            }
        }
    },
    unPublishAssessment : async (req : Request, res : Response) => {
        try {
            const { id } = req.params;
            const assessment = await assessmentService.unpublishAssessment(id);
            res.status(200).json(
                new ApiResponse(
                    true,
                    200,
                    "Assessment Unpublished Successfully",
                    assessment
                )
            )
        } catch (error) {
            console.log("Error unpublishing Assessment : ",error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(
                    new ApiResponse(
                        false,
                        error.statusCode,
                        error.message
                    )
                )
            }else{
                res.status(500).json(
                    new ApiResponse(
                        false,
                        500,
                        "Internal Server Error"
                    )
                )
            }
        }
    },
    getAllAssessments : async (req : Request, res : Response) => {
        try {
            const assessments = await assessmentService.getAllAssessments();
            res.status(200).json(
                new ApiResponse(
                    true,
                    200,
                    "Assessments Fetched Successfully",
                    assessments
                )
            )
        } catch (error) {
            console.log("Error Fetching All Assessment : ",error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(
                    new ApiResponse(
                        false,
                        error.statusCode,
                        error.message
                    )
                )
            }else{
                res.status(500).json(
                    new ApiResponse(
                        false,
                        500,
                        "Internal Server Error"
                    )
                )
            }
        }
    },
    fetchSubmissionsById: async (req: Request, res: Response) => {
  try {
    const { assessmentId } = req.params;
    const submissions = await assessmentService.fetchSubmissionsById(assessmentId);

    if (!submissions.length) {
      return res.status(404).json(
        new ApiResponse(false, 404, "No submissions found")
      );
    }

    type SubmissionRow = (typeof submissions)[number];

    const fields = [
      { label: "email", value: "email" },
      { label: "score", value: "assessmentIndex" },
      {label : "dominant area", value : "dominantArea"},
      {
        label: "Submitted At (IST)",
        value: (row: SubmissionRow) => formatToIST(row.createdAt),
      },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(submissions);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="assessment-submissions.csv"`
    );

    return res.status(200).send(csv);
  } catch (error) {
    console.error("Error Fetching Submissions:", error);

    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(
        new ApiResponse(false, error.statusCode, error.message)
      );
    }

    return res.status(500).json(
      new ApiResponse(false, 500, "Internal Server Error")
    );
  }
}

}
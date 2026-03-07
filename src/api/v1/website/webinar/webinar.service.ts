import ApiError from "../../../../shared/utils/ApiError";
import {prisma} from '../../../../infrastructure/prisma/client';

export const fetchWebinarByIdService = async (webinarId : string) => {
  const webinar = await prisma.webinar.findUnique({
    where : {
      id : webinarId
    },
    select : {
      id : true,
      title : true,
      description : true,
      bannerUrl : true,
      startTime : true,
      endTime : true,
      price : true,
      currency : true,
      status : true
    }
  });

  if(!webinar || webinar.status !== "PUBLISHED"){
    throw new ApiError(404,"Webinar not found");  
  }

  return webinar;
}

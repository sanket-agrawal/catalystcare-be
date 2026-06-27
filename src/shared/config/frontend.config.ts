import dotenv from 'dotenv';
import { serverConfig } from './server.config';
dotenv.config();

export const frontendConfig = {
  therapistProfilePage: `${serverConfig.baseFrontendUrl}/therapist`,
  therapistDashboardPage: `${serverConfig.baseFrontendUrl}/therapist-dashboard`,
  therapistAvailabilityPage: `${serverConfig.baseFrontendUrl}/therapist-dashboard/availability`,
  therapistListingPage: `${serverConfig.baseFrontendUrl}/therapists`,
};

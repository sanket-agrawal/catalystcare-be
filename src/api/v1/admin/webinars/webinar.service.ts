import ApiError from "../../../../shared/utils/ApiError";
import {prisma} from '../../../../infrastructure/prisma/client'

const WebinarService = {
webinarBillingsDashboard: async () => {
  try {

    const [
      totalRevenuePaise,
      platformRevenuePaise,
      gatewayRevenuePaise,
      totalClients,
      therapistRevenuePaise,
      transactions
    ] = await Promise.all([

      prisma.payment.aggregate({
        _sum: { amountPaise: true },
        where: {
          webinarRegistrationId: { not: null },
          status: "CAPTURED"
        }
      }),

      prisma.payment.aggregate({
        _sum: { platformFeePaise: true },
        where: {
          webinarRegistrationId: { not: null },
          status: "CAPTURED"
        }
      }),

      prisma.payment.aggregate({
        _sum: { gatewayFeePaise: true },
        where: {
          webinarRegistrationId: { not: null },
          status: "CAPTURED"
        }
      }),

      prisma.payment.count({
        where: {
          webinarRegistrationId: { not: null },
          status: "CAPTURED"
        }
      }),

      prisma.payment.aggregate({
        _sum: { payoutAmountPaise: true },
        where: {
          webinarRegistrationId: { not: null },
          status: "CAPTURED"
        }
      }),

      prisma.payment.findMany({
        select: {
          status: true,
          amount: true,
          createdAt: true,

          commissionRate: {
            select: {
              gatewayPercent: true,
              platformPercent: true
            }
          },

          payoutAmountPaise: true,
          gatewayFeePaise: true,
          platformFeePaise: true,

          webinarRegistration: {
            select: {
              guestName: true,
              guestEmail: true,
              guestPhone: true,

              webinar: {
                select: {
                  id: true,
                  title: true,
                  startTime: true,
                  meetingLink : true,
                  meetingProvider : true,
                  therapist: {
                    select: {
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                          email: true,
                          mobileNumber: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }

        },

        where: {
          webinarRegistrationId: { not: null }
        },

        orderBy: { createdAt: "desc" }

      })

    ]);

    return {
      totalRevenue: (totalRevenuePaise._sum.amountPaise || 0) / 100,
      platformRevenue: (platformRevenuePaise._sum.platformFeePaise || 0) / 100,
      gatewayFeeRevenue: (gatewayRevenuePaise._sum.gatewayFeePaise || 0) / 100,
      totalClients,
      therapistRevenue: (therapistRevenuePaise._sum.payoutAmountPaise || 0) / 100,

      completeTherapistPayout: 0,
      pendingTherapistPayout: 0,

      transactions
    };

  } catch (error) {

    if (error instanceof ApiError)
      throw new ApiError(error.statusCode, error.message);

    throw error;

  }
}
}

export default WebinarService;
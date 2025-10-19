import {AgeGroup,GenderIdentity,Occupation,SeekingSupportFor,RelationShipStatus} from '@prisma/client'

export type ClientProfileUpdateData = {
    ageGroup : AgeGroup,
    genderIdentity : GenderIdentity,
    occupation : Occupation,
    seekingSupportFor : SeekingSupportFor,
    relationShipStatus : RelationShipStatus
}

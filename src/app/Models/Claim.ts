import { ClaimStatus } from './claim-status';
import {IPolicy} from './Policy';
import { IClaimHistory } from './ClaimHistory';
import { IClaimDocument } from './ClaimDocument';
export interface IClaim{
    ClaimNumber:number,
    ClaimId:number,
    ClaimAmount:number,
    ClaimReason:string,
    AgentRemarks?:string,
    AdminRemarks?:string,
    IncidentDate:Date,
    ClaimStatus:ClaimStatus,
    CreatedDate:Date,
    UpdatedDate:Date,
     PolicyId:number,
     Policy?:IPolicy,
     ClaimDocuments:IClaimDocument[],
     ClaimHistories:IClaimHistory[]

}
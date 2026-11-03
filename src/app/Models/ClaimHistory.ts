import { IClaim } from "./Claim";
import { ClaimStatus } from "./claim-status";
import { IUser } from "./User";
export interface IClaimHistory{
    
    HistoryId:number,
    PreviousStatus:ClaimStatus,
    NewStatus:ClaimStatus,
    Remarks:string,
    UpdatedDate:Date,
    UpdatedBy:string,
    ClaimId:number,
    UserId:number,
    Claim?:IClaim,
User?:IUser

}
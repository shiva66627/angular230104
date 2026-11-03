import { DocumentReference } from './document-reference';
import {IClaim} from "./Claim"
export interface IClaimDocument{
    DocumentId:number,
    DocumentName:string,
    DocumentType:string,
    Field:string,
    UploadedDate:Date,
    DocumentReference:DocumentReference,
    ClaimId:number,
    Claim?:IClaim
}
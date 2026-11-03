import { PaymentMode } from './payment-mode';
import { PaymentStatus } from "./payment-status";
import {IPolicy} from "./Policy";
export interface IPremiumPayment{
    PaymentId:number,
    Amount:number,
    PaymentMode:PaymentMode,
    PaymentStatus:PaymentStatus,
    PaymentDate:Date,
    CreatedDate:Date,
    TransactionReferenceNo:string,
    PolicyId:number,
    Policy?:IPolicy
}
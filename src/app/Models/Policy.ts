import { PolicyStatus } from "./policy-status";
import {ICustomer} from "./Customer";
import {IClaim} from "./Claim";
import { IPolicyPlan } from "./PolicyPlan";
import {IPremiumPayment} from "./PremiumPayment";
export interface IPolicy{
     PolicyId:number,
     PolicyNumber:number,
     PremiumPaid:number,
     StartDate:Date,
     EndDate:Date,
     CreatedDate:Date,
     UpdatedDate:Date,
     PolicyStatus:PolicyStatus,
     PlanId:number,
     CustomerId:number,
     PolicyPlan?:IPolicyPlan,
     Customer?:ICustomer,
     PremiumPayments:IPremiumPayment[],
     Claims:IClaim[]
}
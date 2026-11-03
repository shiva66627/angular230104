import {PremiumType} from "./PremiumType";
import {PlanStatus} from "./plan-status";
import { IInsuranceProduct } from './InsuranceProduct';
import {IPolicy} from './Policy';
export interface IPolicyPlan{
    PremiumType:PremiumType,
    PlanStatus:PlanStatus,
    PlanId:number,
    PlanName:string,
    CoverageAmount:number,
    PremiumAmount:number,
    DurationYears:number,
    TermsConditions:string,
    CreatedDate:Date,
    UpdatedDate:Date,
    ProductId:number,
    InsuranceProduct?:IInsuranceProduct,
    Policies:IPolicy[]
}
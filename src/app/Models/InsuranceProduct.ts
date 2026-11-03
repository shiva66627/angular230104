import { ProductStatus } from './product-status';
import { ProductType } from './product-type';
import { IPolicyPlan } from './PolicyPlan';

export interface IInsuranceProduct {

    productId: number;

    productName: string;

    productType: ProductType;

    status: ProductStatus;

    description: string;

    createdDate: Date;

    updatedDate: Date | null;

    policyPlans?: IPolicyPlan[];

}
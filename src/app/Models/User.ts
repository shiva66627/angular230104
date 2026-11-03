import {Role} from './role';
import { ActiveStatus } from './active-status';
import { IClaimHistory } from './ClaimHistory';
import { ICustomer } from './Customer';

export interface IUser{
  userId: number,
  fullName: string,
  email: string,
  passwordHash: string,
  mobileNumber: string,
  role: Role,
  activeStatus: ActiveStatus,
  createdDate: Date,
  updatedDate: Date,
  claimHistories:IClaimHistory[],
  customer?:ICustomer
}
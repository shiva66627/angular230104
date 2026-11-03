export interface ICustomer {
  customerId: number;
  fullName: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: Date;
  city: string;
  address: string;
  state: string;
  pincode: string;
  nomineeName: string;
  nomineeRelation: string;
  userId: number;
  createdDate: Date;
  occupation?: string;
  annualIncome?: number;
  gender?: number | string;
}

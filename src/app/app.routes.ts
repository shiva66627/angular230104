import { Routes } from '@angular/router';

import { Login } from './auth/login/login';
import { Register } from './auth/register/register';

import { AdminDashboard } from './admin/admin-dashboard/admin-dashboard';
import { StaffDashboard } from './staff/staff-dashboard/staff-dashboard';
import { CustomerDashboard } from './customer/customer-dashboard/customer-dashboard';

import { adminGuard } from './guards/admin-guard';
import { staffGuard } from './guards/staff-guard';
import { customerGuard } from './guards/customer-guard';

import { Users } from './admin/users/users';
import { Customers } from './admin/customers/customers';
import { InsuranceProducts } from './admin/insurance-products/insurance-products';
import { PolicyPlans } from './admin/policy-plans/policy-plans';
import { Policies } from './admin/policies/policies';
import { Claims } from './admin/claims/claims';
import { ClaimHistory } from './admin/claim-history/claim-history';
import { ClaimDocument } from './admin/claim-document/claim-document';
import { PremiumPayments } from './admin/premium-payments/premium-payments';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: Login
  },

  {
    path: 'register',
    component: Register
  },

  // ===========================
  // Admin Dashboard
  // ===========================

  {
    path: 'admin/dashboard',
    component: AdminDashboard,
    canActivate: [adminGuard]
  },

  {
    path: 'admin/users',
    component: Users,
    canActivate: [adminGuard]
  },

  {
    path: 'admin/customers',
    component: Customers,
    canActivate: [adminGuard]
  },

  {
    path: 'admin/products',
    component: InsuranceProducts,
    canActivate: [adminGuard]
  },

  {
    path: 'admin/policyplans',
    component: PolicyPlans,
    canActivate: [adminGuard]
  },

  {
    path: 'admin/policies',
    component: Policies,
    canActivate: [adminGuard]
  },

  {
    path: 'admin/claims',
    component: Claims,
    canActivate: [adminGuard]
  },

  {
    path: 'admin/claim-history',
    component: ClaimHistory,
    canActivate: [adminGuard]
  },

  {
    path: 'admin/claim-document',
    component: ClaimDocument,
    canActivate: [adminGuard]
  },

  {
    path: 'admin/premium-payments',
    component: PremiumPayments,
    canActivate: [adminGuard]
  },

  // ===========================
  // Staff Dashboard
  // ===========================

  {
    path: 'staff/dashboard',
    component: StaffDashboard,
    canActivate: [staffGuard]
  },
  {
    path: 'staff/customers',
    loadComponent: () => import('./staff/customers/customers').then(m => m.Customers),
    canActivate: [staffGuard]
  },
  {
    path: 'staff/policies',
    loadComponent: () => import('./staff/policies/policies').then(m => m.Policies),
    canActivate: [staffGuard]
  },
  {
    path: 'staff/premium-payments',
    loadComponent: () => import('./staff/premium-payments/premium-payments').then(m => m.PremiumPayments),
    canActivate: [staffGuard]
  },
  {
    path: 'staff/claims',
    loadComponent: () => import('./staff/claims/claims').then(m => m.Claims),
    canActivate: [staffGuard]
  },
  {
    path: 'staff/claim-history',
    loadComponent: () => import('./staff/claim-history/claim-history').then(m => m.ClaimHistory),
    canActivate: [staffGuard]
  },
  {
    path: 'staff/claim-documents',
    loadComponent: () => import('./staff/claim-documents/claim-documents').then(m => m.ClaimDocuments),
    canActivate: [staffGuard]
  },

  // ===========================
  // Customer Dashboard
  // ===========================

  {
    path: 'customer/dashboard',
    component: CustomerDashboard,
    canActivate: [customerGuard]
  },

  {
    path: 'customer/profile',
    loadComponent: () => import('./customer/profile/profile').then(m => m.Profile),
    canActivate: [customerGuard]
  },

  {
    path: 'customer/products',
    loadComponent: () => import('./customer/insurance-products/insurance-products').then(m => m.InsuranceProducts),
    canActivate: [customerGuard]
  },

  {
    path: 'customer/policyplans',
    loadComponent: () => import('./customer/policy-plans/policy-plans').then(m => m.PolicyPlans),
    canActivate: [customerGuard]
  },

  {
    path: 'customer/my-policies',
    loadComponent: () => import('./customer/my-policies/my-policies').then(m => m.MyPolicies),
    canActivate: [customerGuard]
  },

  {
    path: 'customer/my-claims',
    loadComponent: () => import('./customer/my-claims/my-claims').then(m => m.MyClaims),
    canActivate: [customerGuard]
  },

  {
    path: 'customer/premium-payments',
    loadComponent: () => import('./customer/premium-payments/premium-payments').then(m => m.PremiumPayments),
    canActivate: [customerGuard]
  },

  // ===========================
  // Default
  // ===========================

  {
    path: '**',
    redirectTo: 'login'
  }

];
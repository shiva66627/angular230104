import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const customerGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);

  let role = null;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    role = localStorage.getItem('role');
  }

  if (role === 'Customer') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
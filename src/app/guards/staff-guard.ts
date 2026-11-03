import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const staffGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  let role = null;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    role = localStorage.getItem('role');
  }

  if (role === 'Staff' || role === 'Admin') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
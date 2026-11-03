import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Do not attach backend JWT Bearer tokens to external APIs (like Cloudinary)
  if (req.url.includes('cloudinary.com') || !req.url.includes('localhost:7053')) {
    return next(req);
  }

  let token = null;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    token = localStorage.getItem('token');
  }

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};

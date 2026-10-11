import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guarda de la landing ("/"): si ya hay sesión, redirige directo a la pantalla del rol
 * (landingRoute cacheado en el login/perfil) en vez de mostrar la landing de nuevo.
 */
export const homeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) return true;

  const landingRoute = authService.getCachedLandingRoute() || '/admin/dashboard';
  return router.createUrlTree([landingRoute]);
};

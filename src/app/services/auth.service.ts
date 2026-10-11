import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthUser, LoginResult } from '../models/system.models';

const TOKEN_KEY = 'iyumi_token';
const LANDING_ROUTE_KEY = 'iyumi_landing_route';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'https://localhost:7198/api';

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$: Observable<AuthUser | null> = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    if (this.getToken()) {
      this.fetchProfile().subscribe({
        error: err => console.error('No se pudo restaurar la sesión:', err)
      });
    }
  }

  login(email: string, password: string): Observable<LoginResult> {
    return this.http.post<LoginResult>(`${this.baseUrl}/auth/login`, { email, password }).pipe(
      tap(result => this.applyLoginResult(result))
    );
  }

  /** Guarda token + usuario de una sesión ya resuelta (login normal o el wizard de alta de tienda). */
  applyLoginResult(result: LoginResult): void {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(LANDING_ROUTE_KEY, result.user.landingRoute || '/admin/dashboard');
    this.currentUserSubject.next(result.user);
  }

  fetchProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/auth/me`).pipe(
      tap(user => {
        localStorage.setItem(LANDING_ROUTE_KEY, user.landingRoute || '/admin/dashboard');
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /** Limpia la sesión local sin navegar (para guards que ya deciden a dónde redirigir). */
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LANDING_ROUTE_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** Última ruta de destino conocida para el rol del usuario (cacheada en el login/perfil). */
  getCachedLandingRoute(): string | null {
    return localStorage.getItem(LANDING_ROUTE_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  hasPermission(key: string): boolean {
    const user = this.currentUser;
    if (!user) return false;
    return user.isSuperAdmin || user.permissions.includes(key);
  }
}

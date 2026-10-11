import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-main); padding: 16px; position: relative;">
      <button class="theme-toggle" style="position: absolute; top: 20px; right: 20px;" (click)="toggleTheme()" [title]="(themeService.theme$ | async) === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'">
        {{ (themeService.theme$ | async) === 'light' ? '🌙' : '☀️' }}
      </button>
      <div class="card-panel" style="width: 100%; max-width: 400px; margin-bottom: 0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 48px; height: 48px; margin: 0 auto 12px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 22px; color: #fff; box-shadow: 0 0 20px var(--primary-glow);">I</div>
          <h2 style="margin: 0;">Iyumi</h2>
          <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Ingresá con tu cuenta para continuar.</p>
        </div>

        <div *ngIf="errorMessage" style="background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.35); color: var(--danger); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 16px; font-size: 13px;">
          {{ errorMessage }}
        </div>

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" name="email" [(ngModel)]="email" required autocomplete="username" placeholder="tu@email.com">
          </div>

          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <input type="password" class="form-control" name="password" [(ngModel)]="password" required autocomplete="current-password" placeholder="••••••••">
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 8px;" [disabled]="loading || !email || !password">
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router, public themeService: ThemeService) {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onSubmit(): void {
    if (!this.email || !this.password || this.loading) return;
    this.loading = true;
    this.errorMessage = null;

    this.authService.login(this.email, this.password).subscribe({
      next: result => {
        this.loading = false;
        this.router.navigateByUrl(result.user.landingRoute || '/admin/dashboard');
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al iniciar sesión.';
      }
    });
  }
}

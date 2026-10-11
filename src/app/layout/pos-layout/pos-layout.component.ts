import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-pos-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div style="min-height: 100vh; display: flex; flex-direction: column;">
      <header class="top-header" style="position: sticky; top: 0; z-index: 90;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="brand-logo" style="width: 32px; height: 32px; font-size: 16px;">I</div>
          <div class="brand-title" style="font-size: 16px;">Iyumi</div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span *ngIf="authService.currentUser$ | async as user" style="color: var(--text-muted); font-size: 13px;">
            {{ user.displayName }}
          </span>
          <button class="theme-toggle" (click)="toggleTheme()" [title]="(themeService.theme$ | async) === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'">
            {{ (themeService.theme$ | async) === 'light' ? '🌙' : '☀️' }}
          </button>
          <button class="btn btn-secondary btn-sm" (click)="logout()">🚪 Cerrar Sesión</button>
        </div>
      </header>

      <main style="flex: 1; padding: 16px;">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class PosLayoutComponent {
  constructor(public authService: AuthService, public themeService: ThemeService) {}

  logout(): void {
    this.authService.logout();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}

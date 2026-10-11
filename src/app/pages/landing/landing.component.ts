import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-main); padding: 16px; position: relative;">
      <button class="theme-toggle" style="position: absolute; top: 20px; right: 20px;" (click)="themeService.toggleTheme()" [title]="(themeService.theme$ | async) === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'">
        {{ (themeService.theme$ | async) === 'light' ? '🌙' : '☀️' }}
      </button>

      <div class="card-panel" style="width: 100%; max-width: 440px; margin-bottom: 0; text-align: center;">
        <div style="width: 56px; height: 56px; margin: 0 auto 16px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 26px; color: #fff; box-shadow: 0 0 20px var(--primary-glow);">I</div>

        <h1 style="margin: 0 0 8px; font-size: 26px;">Iyumi</h1>
        <p style="color: var(--text-muted); font-size: 14px; margin: 0 0 32px; line-height: 1.5;">
          Gestión de inventario, ventas y múltiples sucursales para tu negocio.
        </p>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <a routerLink="/signup" class="btn btn-primary" style="justify-content: center;">
            🛒 Crear mi tienda
          </a>
          <a routerLink="/login" class="btn btn-secondary" style="justify-content: center;">
            Ya tengo una cuenta — Ingresar
          </a>
        </div>
      </div>
    </div>
  `
})
export class LandingComponent {
  constructor(public themeService: ThemeService) {}
}

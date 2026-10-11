import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-container">
      <!-- Left Sidebar Navigation -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand-logo">I</div>
          <div class="brand-title">Iyumi Admin</div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-label">General</div>
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📊</span>
            <span>Dashboard</span>
          </a>

          <div class="nav-label">Gestión Multi-Tenant</div>
          <a routerLink="/admin/tenants" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏢</span>
            <span>Tenants</span>
          </a>
          <a routerLink="/admin/branches" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📍</span>
            <span>Sucursales</span>
          </a>
          <a routerLink="/admin/warehouses" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏬</span>
            <span>Almacenes</span>
          </a>
          <a routerLink="/admin/categories" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📂</span>
            <span>Categorías</span>
          </a>
          <a routerLink="/admin/locations" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🗺️</span>
            <span>Ubicaciones</span>
          </a>

          <div class="nav-label">Catálogo e Inventario</div>
          <a routerLink="/admin/scan" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📷</span>
            <span>Escaneo Rápido</span>
          </a>
          <a routerLink="/admin/products" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📦</span>
            <span>Productos</span>
          </a>
          <a routerLink="/admin/product-variants" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏷️</span>
            <span>Variantes</span>
          </a>
          <a routerLink="/admin/product-attributes" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🎨</span>
            <span>Atributos</span>
          </a>
          <a routerLink="/admin/inventory-stock" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📈</span>
            <span>Inventario / Stock</span>
          </a>
          <a routerLink="/admin/inventory-movements" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📒</span>
            <span>Kardex / Movimientos</span>
          </a>

          <ng-container *ngIf="authService.currentUser$ | async as user">
            <ng-container *ngIf="user.isSuperAdmin || user.permissions.includes('users.view') || user.permissions.includes('roles.view')">
              <div class="nav-label">Administración del Sistema</div>
              <a *ngIf="user.isSuperAdmin || user.permissions.includes('users.view')" routerLink="/admin/users" routerLinkActive="active" class="nav-item">
                <span class="nav-icon">👤</span>
                <span>Usuarios</span>
              </a>
              <a *ngIf="user.isSuperAdmin || user.permissions.includes('roles.view')" routerLink="/admin/roles" routerLinkActive="active" class="nav-item">
                <span class="nav-icon">🔑</span>
                <span>Roles</span>
              </a>
            </ng-container>
          </ng-container>
        </nav>
      </aside>

      <!-- Main Wrapper -->
      <div class="main-wrapper">
        <header class="top-header">
          <div class="page-title-area">
            <h1>Panel de Control de Inventario</h1>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="badge badge-info">Iyumi SaaS API v1.0</span>
            <span *ngIf="authService.currentUser$ | async as user" style="color: var(--text-muted); font-size: 13px;">
              {{ user.displayName }}
            </span>
            <button class="theme-toggle" (click)="toggleTheme()" [title]="(themeService.theme$ | async) === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'">
              {{ (themeService.theme$ | async) === 'light' ? '🌙' : '☀️' }}
            </button>
            <button class="btn btn-secondary btn-sm" (click)="logout()">🚪 Cerrar Sesión</button>
          </div>
        </header>

        <main class="content-body">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {
  constructor(public authService: AuthService, public themeService: ThemeService) {}

  logout(): void {
    this.authService.logout();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}

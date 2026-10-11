import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { CurrencyCode, CurrencyCodeOptions, RegisterTenantDto } from '../../models/system.models';

@Component({
  selector: 'app-signup-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-main); padding: 16px; position: relative;">
      <button class="theme-toggle" style="position: absolute; top: 20px; right: 20px;" (click)="themeService.toggleTheme()" [title]="(themeService.theme$ | async) === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'">
        {{ (themeService.theme$ | async) === 'light' ? '🌙' : '☀️' }}
      </button>

      <div class="card-panel" style="width: 100%; max-width: 520px; margin-bottom: 0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0 0 4px;">Crear mi tienda</h2>
          <p style="color: var(--text-muted); font-size: 13px; margin: 0;">Paso {{ step }} de {{ totalSteps }} — {{ stepTitles[step - 1] }}</p>
        </div>

        <!-- Indicador de progreso -->
        <div style="display: flex; gap: 6px; margin-bottom: 28px;">
          <div *ngFor="let t of stepTitles; let i = index"
               style="flex: 1; height: 4px; border-radius: 4px;"
               [style.background]="i < step ? 'var(--primary)' : 'var(--border-color)'">
          </div>
        </div>

        <div *ngIf="errorMessage" style="background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.35); color: var(--danger); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 16px; font-size: 13px;">
          {{ errorMessage }}
        </div>

        <!-- Paso 1: Datos de la tienda -->
        <div *ngIf="step === 1">
          <div class="form-group">
            <label class="form-label">Nombre de tu tienda</label>
            <input type="text" class="form-control" [(ngModel)]="form.storeName" placeholder="Ej: Almacén Don José" autocomplete="organization">
          </div>
          <div class="form-group">
            <label class="form-label">Dirección (opcional)</label>
            <input type="text" class="form-control" [(ngModel)]="form.address" placeholder="Ej: Av. Siempre Viva 742">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono (opcional)</label>
            <input type="text" class="form-control" [(ngModel)]="form.phone" placeholder="Ej: +54 11 1234-5678">
          </div>
          <div class="form-group">
            <label class="form-label">Moneda principal</label>
            <select class="form-control" [(ngModel)]="form.currency">
              <option *ngFor="let c of currencyOptions" [value]="c.value">{{ c.label }}</option>
            </select>
          </div>
        </div>

        <!-- Paso 2: Cómo opera -->
        <div *ngIf="step === 2">
          <p style="color: var(--text-muted); font-size: 13px; margin: 0 0 16px;">Esto nos ayuda a dejarte la configuración inicial lista.</p>
          <label class="form-check">
            <input type="checkbox" [(ngModel)]="form.allowMultiBranch">
            <span>Tengo (o voy a tener) más de una sucursal</span>
          </label>
          <label class="form-check">
            <input type="checkbox" [(ngModel)]="form.allowMultiWarehouse">
            <span>Tengo (o voy a tener) más de un depósito/almacén</span>
          </label>
          <label class="form-check">
            <input type="checkbox" [(ngModel)]="form.sellsByWeight">
            <span>Vendo productos pesables (por peso/balanza)</span>
          </label>
          <label class="form-check">
            <input type="checkbox" [(ngModel)]="form.hasColorOrSizeVariants">
            <span>Mis productos se diferencian por color y/o talle</span>
          </label>
        </div>

        <!-- Paso 3: Costos y reportes -->
        <div *ngIf="step === 3">
          <p style="color: var(--text-muted); font-size: 13px; margin: 0 0 16px;">
            Si llevás el costo de tus compras, vamos a poder calcularte el margen de ganancia y, más adelante,
            reportes como el estado de resultado.
          </p>
          <label class="form-check">
            <input type="checkbox" [(ngModel)]="form.trackCosts">
            <span>Quiero llevar costos y márgenes de ganancia</span>
          </label>
        </div>

        <!-- Paso 4: Cuenta de acceso -->
        <div *ngIf="step === 4">
          <div class="form-group">
            <label class="form-label">Tu nombre</label>
            <input type="text" class="form-control" [(ngModel)]="form.ownerDisplayName" placeholder="Ej: José Pérez" autocomplete="name">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" [(ngModel)]="form.ownerEmail" placeholder="tu@email.com" autocomplete="username">
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <input type="password" class="form-control" [(ngModel)]="form.ownerPassword" placeholder="Mínimo 6 caracteres" autocomplete="new-password">
          </div>
          <div class="form-group">
            <label class="form-label">Repetir contraseña</label>
            <input type="password" class="form-control" [(ngModel)]="confirmPassword" placeholder="Repetí la contraseña" autocomplete="new-password">
          </div>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button *ngIf="step > 1" class="btn btn-secondary" (click)="back()" [disabled]="loading">Atrás</button>
          <button *ngIf="step < totalSteps" class="btn btn-primary" style="flex: 1; justify-content: center;" (click)="next()" [disabled]="!canAdvance()">Siguiente</button>
          <button *ngIf="step === totalSteps" class="btn btn-primary" style="flex: 1; justify-content: center;" (click)="submit()" [disabled]="loading || !canAdvance()">
            {{ loading ? 'Creando tienda...' : 'Crear tienda' }}
          </button>
        </div>

        <p style="text-align: center; margin: 20px 0 0; font-size: 13px; color: var(--text-muted);">
          ¿Ya tenés una cuenta? <a routerLink="/login" style="color: var(--primary);">Ingresá acá</a>
        </p>
      </div>
    </div>
  `
})
export class SignupWizardComponent {
  totalSteps = 4;
  step = 1;
  stepTitles = ['Tu tienda', 'Cómo operás', 'Costos y reportes', 'Cuenta de acceso'];

  currencyOptions = CurrencyCodeOptions;
  confirmPassword = '';
  loading = false;
  errorMessage: string | null = null;

  form: RegisterTenantDto = {
    storeName: '',
    address: '',
    phone: '',
    currency: CurrencyCode.USD,
    allowMultiBranch: false,
    allowMultiWarehouse: false,
    sellsByWeight: false,
    hasColorOrSizeVariants: false,
    trackCosts: true,
    ownerDisplayName: '',
    ownerEmail: '',
    ownerPassword: ''
  };

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {}

  canAdvance(): boolean {
    if (this.step === 1) return !!this.form.storeName.trim();
    if (this.step === 4) {
      return !!this.form.ownerDisplayName.trim()
        && !!this.form.ownerEmail.trim()
        && this.form.ownerPassword.length >= 6
        && this.form.ownerPassword === this.confirmPassword;
    }
    return true;
  }

  next(): void {
    if (!this.canAdvance() || this.step >= this.totalSteps) return;
    this.errorMessage = null;
    this.step++;
  }

  back(): void {
    if (this.step <= 1) return;
    this.errorMessage = null;
    this.step--;
  }

  submit(): void {
    if (!this.canAdvance() || this.loading) return;
    this.loading = true;
    this.errorMessage = null;

    this.api.registerTenant(this.form).subscribe({
      next: result => {
        this.loading = false;
        this.authService.applyLoginResult(result);
        this.router.navigateByUrl(result.user.landingRoute || '/admin/dashboard');
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'No se pudo crear la tienda. Intentá de nuevo.';
      }
    });
  }
}

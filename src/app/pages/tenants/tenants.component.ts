import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Tenant, CreateTenantDto, CurrencyCode, CurrencyCodeOptions } from '../../models/system.models';

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card-panel">
      <div class="card-header-actions">
        <div>
          <h2>Administración de Tenants</h2>
          <p style="color: var(--text-muted); font-size: 13px;">Gestión de empresas multi-inquilino y configuraciones globales.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span>➕</span> Nuevo Tenant
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Moneda Principal</th>
              <th>Multi-Almacén</th>
              <th>Multi-Sucursal</th>
              <th>Control Inventario</th>
              <th>Costos/Márgenes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of tenants">
              <td>#{{ t.id }}</td>
              <td><strong>{{ t.name }}</strong></td>
              <td><code>{{ t.slug }}</code></td>
              <td><span class="badge badge-info">{{ getCurrencyLabel(t.currency) }}</span></td>
              <td>
                <span class="badge" [ngClass]="t.allowMultiWarehouse ? 'badge-success' : 'badge-danger'">
                  {{ t.allowMultiWarehouse ? 'Sí' : 'No' }}
                </span>
              </td>
              <td>
                <span class="badge" [ngClass]="t.allowMultiBranch ? 'badge-success' : 'badge-danger'">
                  {{ t.allowMultiBranch ? 'Sí' : 'No' }}
                </span>
              </td>
              <td>
                <span class="badge" [ngClass]="t.trackInventory ? 'badge-success' : 'badge-danger'">
                  {{ t.trackInventory ? 'Sí' : 'No' }}
                </span>
              </td>
              <td>
                <span class="badge" [ngClass]="t.trackCosts ? 'badge-success' : 'badge-danger'">
                  {{ t.trackCosts ? 'Sí' : 'No' }}
                </span>
              </td>
              <td>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" (click)="openEditModal(t)">✏️ Editar</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteTenant(t.id)">🗑️ Eliminar</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="tenants.length === 0">
              <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 24px;">No hay tenants registrados en la base de datos.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Editar Tenant' : 'Crear Nuevo Tenant' }}</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre del Tenant / Empresa</label>
            <input type="text" class="form-control" [(ngModel)]="form.name" placeholder="Ej: Supermercados Iyumi S.A.">
          </div>

          <div class="form-group">
            <label class="form-label">Slug Único</label>
            <input type="text" class="form-control" [(ngModel)]="form.slug" placeholder="Ej: iyumi-super">
          </div>

          <div class="form-group">
            <label class="form-label">Moneda Principal de Operación</label>
            <select class="form-control" [(ngModel)]="form.currency">
              <option *ngFor="let c of currencyOptions" [value]="c.value">{{ c.label }}</option>
            </select>
          </div>

          <div style="margin-top: 16px;">
            <label class="form-check">
              <input type="checkbox" [(ngModel)]="form.allowMultiWarehouse">
              <span>Permitir Múltiples Almacenes / Depósitos</span>
            </label>

            <label class="form-check">
              <input type="checkbox" [(ngModel)]="form.allowMultiBranch">
              <span>Permitir Múltiples Sucursales</span>
            </label>

            <label class="form-check">
              <input type="checkbox" [(ngModel)]="form.trackInventory">
              <span>Habilitar Rastreo y Control de Inventario</span>
            </label>

            <label class="form-check">
              <input type="checkbox" [(ngModel)]="form.trackCosts">
              <span>Llevar Costos y Márgenes de Ganancia</span>
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveTenant()">
            {{ isEditing ? 'Guardar Cambios' : 'Crear Tenant' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class TenantsComponent implements OnInit {
  tenants: Tenant[] = [];
  currencyOptions = CurrencyCodeOptions;
  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;

  form: CreateTenantDto = {
    name: '',
    slug: '',
    currency: CurrencyCode.USD,
    allowMultiWarehouse: true,
    allowMultiBranch: true,
    trackInventory: true,
    trackCosts: true
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.apiService.getTenants().subscribe({
      next: data => this.tenants = data,
      error: err => console.error('Error al cargar tenants:', err)
    });
  }

  normalizeCurrency(val: any): CurrencyCode {
    if (!val) return CurrencyCode.USD;
    if (typeof val === 'number') {
      const numberMap: { [key: number]: CurrencyCode } = {
        1: CurrencyCode.USD,
        2: CurrencyCode.ARS,
        3: CurrencyCode.EUR,
        4: CurrencyCode.BRL,
        5: CurrencyCode.CLP,
        6: CurrencyCode.MXN,
        7: CurrencyCode.UYU,
        8: CurrencyCode.COP,
        9: CurrencyCode.PEN
      };
      return numberMap[val] || CurrencyCode.USD;
    }
    const str = String(val).toUpperCase();
    if (Object.values(CurrencyCode).includes(str as CurrencyCode)) {
      return str as CurrencyCode;
    }
    const num = parseInt(str, 10);
    if (!isNaN(num)) {
      return this.normalizeCurrency(num);
    }
    return CurrencyCode.USD;
  }

  getCurrencyLabel(currency: any): string {
    const normalized = this.normalizeCurrency(currency);
    const found = this.currencyOptions.find(o => o.value === normalized);
    return found ? found.label.split(' ')[0] : normalized;
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.form = {
      name: '',
      slug: '',
      currency: CurrencyCode.USD,
      allowMultiWarehouse: true,
      allowMultiBranch: true,
      trackInventory: true,
      trackCosts: true
    };
    this.isModalOpen = true;
  }

  openEditModal(tenant: Tenant): void {
    this.isEditing = true;
    this.editingId = tenant.id;
    this.form = {
      name: tenant.name,
      slug: tenant.slug,
      currency: this.normalizeCurrency(tenant.currency || tenant.currencyName),
      allowMultiWarehouse: tenant.allowMultiWarehouse ?? true,
      allowMultiBranch: tenant.allowMultiBranch ?? true,
      trackInventory: tenant.trackInventory ?? true,
      trackCosts: tenant.trackCosts ?? true
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveTenant(): void {
    if (!this.form.name || !this.form.slug) {
      alert('Por favor completa el nombre y slug del tenant.');
      return;
    }

    const payload: CreateTenantDto = {
      ...this.form,
      currency: this.normalizeCurrency(this.form.currency)
    };

    if (this.isEditing && this.editingId) {
      this.apiService.updateTenant(this.editingId, payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadTenants();
        },
        error: err => alert('Error al actualizar tenant: ' + err.message)
      });
    } else {
      this.apiService.createTenant(payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadTenants();
        },
        error: err => alert('Error al crear tenant: ' + err.message)
      });
    }
  }

  deleteTenant(id: number): void {
    if (confirm('¿Estás seguro de eliminar este tenant?')) {
      this.apiService.deleteTenant(id).subscribe({
        next: () => this.loadTenants(),
        error: err => alert('Error al eliminar tenant: ' + err.message)
      });
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectOnFocusDirective } from '../../directives/select-on-focus.directive';
import { ApiService } from '../../services/api.service';
import { Branch, CreateBranchDto, Tenant } from '../../models/system.models';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectOnFocusDirective],
  template: `
    <div class="card-panel">
      <div class="card-header-actions">
        <div>
          <h2>Administración de Sucursales</h2>
          <p style="color: var(--text-muted); font-size: 13px;">Gestión de puntos de venta y geolocalización de sucursales por tenant.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span>➕</span> Nueva Sucursal
        </button>
      </div>

      <!-- Proximity Search Test Filter -->
      <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 24px;">
        <h4 style="margin-bottom: 12px; font-size: 14px; color: var(--primary);">📍 Búsqueda por Proximidad y Geolocalización (Haversine)</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; align-items: end;">
          <div>
            <label class="form-label">Latitud Mi Ubicación</label>
            <input type="number" selectOnFocus step="any" class="form-control" [(ngModel)]="searchLat" placeholder="-34.6037">
          </div>
          <div>
            <label class="form-label">Longitud Mi Ubicación</label>
            <input type="number" selectOnFocus step="any" class="form-control" [(ngModel)]="searchLng" placeholder="-58.3816">
          </div>
          <div>
            <label class="form-label">Radio Máx (Km)</label>
            <input type="number" selectOnFocus class="form-control" [(ngModel)]="searchRadius">
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" (click)="searchNearby()">Buscar Cercanas</button>
            <button class="btn btn-secondary" (click)="loadData()" *ngIf="isNearbyFiltered">Ver Todas</button>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tenant</th>
              <th>Nombre Sucursal</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Coordenadas (Lat, Lng)</th>
              <th *ngIf="isNearbyFiltered">Distancia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of branches">
              <td>#{{ b.id }}</td>
              <td><strong>{{ getTenantName(b.tenantId) }}</strong></td>
              <td>{{ b.name }}</td>
              <td>{{ b.address || '-' }}</td>
              <td>{{ b.phone || '-' }}</td>
              <td>
                <small *ngIf="b.latitude && b.longitude" style="color: #818cf8;">
                  {{ b.latitude }}, {{ b.longitude }}
                </small>
                <small *ngIf="!b.latitude || !b.longitude" style="color: var(--text-dim);">Sin coordenadas</small>
              </td>
              <td *ngIf="isNearbyFiltered">
                <span class="badge badge-info">{{ b.distanceKm }} Km</span>
              </td>
              <td>
                <span class="badge" [ngClass]="b.active ? 'badge-success' : 'badge-danger'">
                  {{ b.active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" (click)="openEditModal(b)">✏️ Editar</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteBranch(b.id)">🗑️ Eliminar</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="branches.length === 0">
              <td [attr.colspan]="isNearbyFiltered ? 9 : 8" style="text-align: center; color: var(--text-muted); padding: 24px;">No hay sucursales registradas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Editar Sucursal' : 'Crear Nueva Sucursal' }}</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Tenant / Empresa Perteneciente *</label>
            <select class="form-control" [(ngModel)]="form.tenantId" [disabled]="isEditing">
              <option [value]="0" disabled>-- Selecciona un Tenant --</option>
              <option *ngFor="let t of tenants" [value]="t.id">{{ t.name }} (ID #{{ t.id }})</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Nombre de la Sucursal *</label>
            <input type="text" class="form-control" [(ngModel)]="form.name" placeholder="Ej: Sucursal Centro">
          </div>

          <div class="form-group">
            <label class="form-label">Dirección Física</label>
            <input type="text" class="form-control" [(ngModel)]="form.address" placeholder="Ej: Av. Corrientes 1234">
          </div>

          <div class="form-group">
            <label class="form-label">Teléfono de Contacto</label>
            <input type="text" class="form-control" [(ngModel)]="form.phone" placeholder="Ej: +54 11 4321-8765">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label">Latitud</label>
              <input type="number" selectOnFocus step="any" class="form-control" [(ngModel)]="form.latitude" placeholder="-34.6037">
            </div>
            <div class="form-group">
              <label class="form-label">Longitud</label>
              <input type="number" selectOnFocus step="any" class="form-control" [(ngModel)]="form.longitude" placeholder="-58.3816">
            </div>
          </div>

          <label class="form-check">
            <input type="checkbox" [(ngModel)]="form.active">
            <span>Sucursal Activa</span>
          </label>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveBranch()">
            {{ isEditing ? 'Guardar Cambios' : 'Crear Sucursal' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class BranchesComponent implements OnInit {
  branches: Branch[] = [];
  tenants: Tenant[] = [];
  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;
  isNearbyFiltered = false;

  searchLat: number = -34.6037;
  searchLng: number = -58.3816;
  searchRadius: number = 50;

  form: CreateBranchDto = {
    tenantId: 0,
    name: '',
    address: '',
    phone: '',
    latitude: undefined,
    longitude: undefined,
    active: true
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isNearbyFiltered = false;
    this.apiService.getTenants().subscribe(tData => {
      this.tenants = tData;
      if (this.tenants.length > 0 && this.form.tenantId === 0) {
        this.form.tenantId = this.tenants[0].id;
      }
    });
    this.apiService.getBranches().subscribe(bData => this.branches = bData);
  }

  getTenantName(tenantId: number): string {
    const found = this.tenants.find(t => t.id == tenantId);
    return found ? found.name : `Tenant #${tenantId}`;
  }

  searchNearby(): void {
    if (!this.searchLat || !this.searchLng) {
      alert('Ingresa latitud y longitud válidas para buscar sucursales cercanas.');
      return;
    }
    this.apiService.getNearbyBranches(this.searchLat, this.searchLng, this.searchRadius).subscribe({
      next: data => {
        this.branches = data;
        this.isNearbyFiltered = true;
      },
      error: err => alert('Error en búsqueda de proximidad: ' + err.message)
    });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.form = {
      tenantId: this.tenants.length > 0 ? this.tenants[0].id : 0,
      name: '',
      address: '',
      phone: '',
      latitude: undefined,
      longitude: undefined,
      active: true
    };
    this.isModalOpen = true;
  }

  openEditModal(branch: Branch): void {
    this.isEditing = true;
    this.editingId = branch.id;
    this.form = {
      tenantId: branch.tenantId,
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      latitude: branch.latitude,
      longitude: branch.longitude,
      active: branch.active
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveBranch(): void {
    if (!this.form.tenantId || this.form.tenantId === 0) {
      alert('Debes seleccionar un Tenant para la sucursal.');
      return;
    }
    if (!this.form.name) {
      alert('Debes ingresar el nombre de la sucursal.');
      return;
    }

    if (this.isEditing && this.editingId) {
      this.apiService.updateBranch(this.editingId, this.form).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        },
        error: err => alert('Error al actualizar sucursal: ' + err.message)
      });
    } else {
      this.apiService.createBranch(this.form).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        },
        error: err => alert('Error al crear sucursal: ' + err.message)
      });
    }
  }

  deleteBranch(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta sucursal?')) {
      this.apiService.deleteBranch(id).subscribe({
        next: () => this.loadData(),
        error: err => alert('Error al eliminar sucursal: ' + err.message)
      });
    }
  }
}

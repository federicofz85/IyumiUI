import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Warehouse, CreateWarehouseDto, Tenant } from '../../models/system.models';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card-panel">
      <div class="card-header-actions">
        <div>
          <h2>Administración de Almacenes / Depósitos</h2>
          <p style="color: var(--text-muted); font-size: 13px;">Gestión de depósitos de inventario asignados por tenant.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span>➕</span> Nuevo Almacén
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tenant</th>
              <th>Nombre Almacén</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let w of warehouses">
              <td>#{{ w.id }}</td>
              <td><strong>{{ getTenantName(w.tenantId) }}</strong></td>
              <td>{{ w.name }}</td>
              <td>
                <span class="badge" [ngClass]="w.active ? 'badge-success' : 'badge-danger'">
                  {{ w.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td><small style="color: var(--text-dim);">{{ w.createdAt | date:'shortDate' }}</small></td>
              <td>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" (click)="openEditModal(w)">✏️ Editar</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteWarehouse(w.id)">🗑️ Eliminar</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="warehouses.length === 0">
              <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No hay almacenes registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Editar Almacén' : 'Crear Nuevo Almacén' }}</h3>
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
            <label class="form-label">Nombre del Almacén / Depósito *</label>
            <input type="text" class="form-control" [(ngModel)]="form.name" placeholder="Ej: Depósito Central">
          </div>

          <label class="form-check">
            <input type="checkbox" [(ngModel)]="form.active">
            <span>Almacén Activo</span>
          </label>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveWarehouse()">
            {{ isEditing ? 'Guardar Cambios' : 'Crear Almacén' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class WarehousesComponent implements OnInit {
  warehouses: Warehouse[] = [];
  tenants: Tenant[] = [];
  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;

  form: CreateWarehouseDto = {
    tenantId: 0,
    name: '',
    active: true
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.apiService.getTenants().subscribe(tData => {
      this.tenants = tData;
      if (this.tenants.length > 0 && this.form.tenantId === 0) {
        this.form.tenantId = this.tenants[0].id;
      }
    });
    this.apiService.getWarehouses().subscribe(wData => this.warehouses = wData);
  }

  getTenantName(tenantId: number): string {
    const found = this.tenants.find(t => t.id == tenantId);
    return found ? found.name : `Tenant #${tenantId}`;
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.form = {
      tenantId: this.tenants.length > 0 ? this.tenants[0].id : 0,
      name: '',
      active: true
    };
    this.isModalOpen = true;
  }

  openEditModal(warehouse: Warehouse): void {
    this.isEditing = true;
    this.editingId = warehouse.id;
    this.form = {
      tenantId: warehouse.tenantId,
      name: warehouse.name,
      active: warehouse.active
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveWarehouse(): void {
    if (!this.form.tenantId || this.form.tenantId === 0) {
      alert('Debes seleccionar un Tenant.');
      return;
    }
    if (!this.form.name) {
      alert('Debes ingresar el nombre del almacén.');
      return;
    }

    if (this.isEditing && this.editingId) {
      this.apiService.updateWarehouse(this.editingId, this.form).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        },
        error: err => alert('Error al actualizar almacén: ' + err.message)
      });
    } else {
      this.apiService.createWarehouse(this.form).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        },
        error: err => alert('Error al crear almacén: ' + err.message)
      });
    }
  }

  deleteWarehouse(id: number): void {
    if (confirm('¿Estás seguro de eliminar este almacén?')) {
      this.apiService.deleteWarehouse(id).subscribe({
        next: () => this.loadData(),
        error: err => alert('Error al eliminar almacén: ' + err.message)
      });
    }
  }
}

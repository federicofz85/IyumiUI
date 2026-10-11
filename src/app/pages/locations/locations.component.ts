import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Location, CreateLocationDto, LocationTreeNode, Tenant, Warehouse } from '../../models/system.models';
import { LocationNodeComponent } from './location-node.component';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [CommonModule, FormsModule, LocationNodeComponent],
  template: `
    <div class="card-panel">
      <div class="card-header-actions">
        <div>
          <h2>🗺️ Ubicaciones</h2>
          <p style="color: var(--text-muted); font-size: 13px;">Árbol de ubicaciones (zonas, pasillos, estantes, bins) dentro de un almacén, niveles ilimitados.</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <select class="form-control" style="width: 200px;" [(ngModel)]="tenantId" (change)="onTenantChange()">
            <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
          </select>
          <select class="form-control" style="width: 200px;" [(ngModel)]="warehouseId" (change)="loadTree()">
            <option [ngValue]="undefined" disabled>— Selecciona un Almacén —</option>
            <option *ngFor="let w of filteredWarehouses" [ngValue]="w.id">{{ w.name }}</option>
          </select>
          <button class="btn btn-primary" (click)="openCreateModal()" [disabled]="!warehouseId">
            <span>➕</span> Nueva Ubicación Raíz
          </button>
        </div>
      </div>

      <div *ngIf="filteredWarehouses.length === 0" style="text-align: center; color: var(--text-muted); padding: 40px;">
        Este tenant no tiene almacenes creados. Crea uno primero en la sección Almacenes.
      </div>

      <div *ngIf="filteredWarehouses.length > 0 && tree.length === 0" style="text-align: center; color: var(--text-muted); padding: 40px;">
        <div style="font-size: 32px; margin-bottom: 8px;">🗺️</div>
        No hay ubicaciones registradas para este almacén.
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <app-location-node
          *ngFor="let node of tree"
          [node]="node"
          (edit)="openEditModal($event)"
          (delete)="deleteLocation($event)"
          (addChild)="openCreateModal($event.id)">
        </app-location-node>
      </div>
    </div>

    <!-- Modal Form -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Editar Ubicación' : 'Nueva Ubicación' }}</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre de la Ubicación *</label>
            <input type="text" class="form-control" [(ngModel)]="form.name" placeholder="Ej: Pasillo A, Estante 3, Bin 12">
          </div>

          <div class="form-group">
            <label class="form-label">Ubicación Padre</label>
            <select class="form-control" [(ngModel)]="form.parentLocationId">
              <option [ngValue]="undefined">— Raíz (sin ubicación padre) —</option>
              <option *ngFor="let l of flatLocations" [ngValue]="l.id" [disabled]="isEditing && l.id === editingId">{{ l.name }}</option>
            </select>
          </div>

          <label class="form-check">
            <input type="checkbox" [(ngModel)]="form.active">
            <span>Ubicación Activa</span>
          </label>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveLocation()">
            {{ isEditing ? 'Guardar Cambios' : 'Crear Ubicación' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class LocationsComponent implements OnInit {
  tenants: Tenant[] = [];
  warehouses: Warehouse[] = [];
  filteredWarehouses: Warehouse[] = [];
  tenantId: number | undefined = undefined;
  warehouseId: number | undefined = undefined;

  tree: LocationTreeNode[] = [];
  flatLocations: Location[] = [];

  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;

  form: CreateLocationDto = {
    tenantId: 0,
    warehouseId: 0,
    parentLocationId: undefined,
    name: '',
    active: true
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getTenants().subscribe({
      next: data => {
        this.tenants = data;
        this.tenantId = data[0]?.id;
        this.apiService.getWarehouses().subscribe({
          next: w => {
            this.warehouses = w;
            this.onTenantChange();
          }
        });
      },
      error: err => console.error('Error al cargar tenants:', err)
    });
  }

  onTenantChange(): void {
    this.filteredWarehouses = this.warehouses.filter(w => w.tenantId === this.tenantId);
    this.warehouseId = this.filteredWarehouses[0]?.id;
    this.loadTree();
  }

  loadTree(): void {
    this.tree = [];
    this.flatLocations = [];
    if (!this.tenantId || !this.warehouseId) return;
    this.apiService.getLocationTree(this.tenantId, this.warehouseId).subscribe({
      next: data => this.tree = data,
      error: err => console.error('Error al cargar árbol de ubicaciones:', err)
    });
    this.apiService.getLocations(this.tenantId, this.warehouseId).subscribe({
      next: data => this.flatLocations = data,
      error: err => console.error('Error al cargar ubicaciones:', err)
    });
  }

  openCreateModal(parentLocationId?: number): void {
    if (!this.tenantId || !this.warehouseId) return;
    this.isEditing = false;
    this.editingId = null;
    this.form = {
      tenantId: this.tenantId,
      warehouseId: this.warehouseId,
      parentLocationId,
      name: '',
      active: true
    };
    this.isModalOpen = true;
  }

  openEditModal(node: LocationTreeNode): void {
    const full = this.flatLocations.find(l => l.id === node.id);
    this.isEditing = true;
    this.editingId = node.id;
    this.form = {
      tenantId: this.tenantId!,
      warehouseId: this.warehouseId!,
      parentLocationId: full?.parentLocationId,
      name: node.name,
      active: node.active
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveLocation(): void {
    if (!this.form.name) {
      alert('Por favor ingresa el nombre de la ubicación.');
      return;
    }

    if (this.isEditing && this.editingId) {
      this.apiService.updateLocation(this.editingId, this.form).subscribe({
        next: () => { this.closeModal(); this.loadTree(); },
        error: err => alert('Error al actualizar ubicación: ' + (err.error?.message || err.message))
      });
    } else {
      this.apiService.createLocation(this.form).subscribe({
        next: () => { this.closeModal(); this.loadTree(); },
        error: err => alert('Error al crear ubicación: ' + (err.error?.message || err.message))
      });
    }
  }

  deleteLocation(node: LocationTreeNode): void {
    if (confirm(`¿Eliminar la ubicación "${node.name}"? Esto puede fallar si tiene sububicaciones asociadas.`)) {
      this.apiService.deleteLocation(node.id).subscribe({
        next: () => this.loadTree(),
        error: err => alert('Error al eliminar ubicación: ' + (err.error?.message || err.message))
      });
    }
  }
}

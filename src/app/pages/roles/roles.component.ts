import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Role, CreateRoleDto, UpdateRoleDto, CloneRoleDto, Permission, Tenant } from '../../models/system.models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card-panel">
      <div class="card-header-actions">
        <div>
          <h2>🔑 Roles y Permisos</h2>
          <p style="color: var(--text-muted); font-size: 13px;">Plantillas de sistema y roles custom por tenant, con matriz de permisos por módulo.</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <select class="form-control" style="width: 240px;" [(ngModel)]="filterTenantId" (change)="loadRoles()">
            <option [ngValue]="undefined">— Solo Plantillas de Sistema —</option>
            <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
          </select>
          <button class="btn btn-primary" [disabled]="!filterTenantId" (click)="openCreateModal()" title="Seleccioná un tenant para crear un rol custom">
            <span>➕</span> Nuevo Rol
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Ruta de Aterrizaje</th>
              <th>Permisos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of roles">
              <td>#{{ r.id }}</td>
              <td><strong>{{ r.name }}</strong></td>
              <td>
                <span class="badge" [ngClass]="r.isSystemTemplate ? 'badge-info' : 'badge-success'">
                  {{ r.isSystemTemplate ? 'Plantilla' : 'Custom' }}
                </span>
              </td>
              <td><code style="font-size: 12px;">{{ r.defaultLandingRoute || '—' }}</code></td>
              <td>{{ r.permissionKeys.length }} permiso(s)</td>
              <td>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <button class="btn btn-secondary btn-sm" *ngIf="r.isSystemTemplate" (click)="openCloneModal(r)">📋 Clonar</button>
                  <ng-container *ngIf="!r.isSystemTemplate">
                    <button class="btn btn-secondary btn-sm" (click)="openEditModal(r)">✏️ Editar</button>
                    <button class="btn btn-danger btn-sm" (click)="deleteRole(r)">🗑️</button>
                  </ng-container>
                </div>
              </td>
            </tr>
            <tr *ngIf="roles.length === 0">
              <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No hay roles para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <small *ngIf="hasSystemTemplates" style="color: var(--text-dim); display: block; margin-top: 8px;">
        Las plantillas de sistema se resincronizan solas en cada arranque del backend — para personalizar una, cloná una copia a tu tenant.
      </small>
    </div>

    <!-- Modal: Crear/Editar Rol (matriz de permisos) -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card" style="max-width: 720px;">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Editar Rol' : 'Nuevo Rol' }}</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Nombre del Rol *</label>
              <input type="text" class="form-control" [(ngModel)]="form.name" placeholder="Ej: Supervisor de Depósito">
            </div>
            <div class="form-group">
              <label class="form-label">Ruta de Aterrizaje</label>
              <input type="text" class="form-control" [(ngModel)]="form.defaultLandingRoute" placeholder="/admin/dashboard">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Permisos por Módulo</label>
            <div style="max-height: 360px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px;">
              <div *ngFor="let module of moduleNames" style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                  <label class="form-check" style="margin-bottom: 0;">
                    <input type="checkbox"
                           [checked]="isModuleFullySelected(module)"
                           (change)="toggleModule(module, $event)">
                    <strong>{{ module }}</strong>
                  </label>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px; padding-left: 8px;">
                  <label class="form-check" style="margin-bottom: 0;" *ngFor="let p of permissionsByModule[module]">
                    <input type="checkbox" [checked]="selectedKeys.has(p.key)" (change)="togglePermission(p.key)">
                    <span style="font-size: 13px;" [title]="p.description || p.key">{{ p.description || p.key }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveRole()">
            {{ isEditing ? 'Guardar Cambios' : 'Crear Rol' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Clonar Plantilla -->
    <div class="modal-backdrop" *ngIf="isCloneModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Clonar "{{ cloningRole?.name }}"</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeCloneModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Tenant Destino *</label>
            <select class="form-control" [(ngModel)]="cloneForm.tenantId">
              <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nombre del Nuevo Rol *</label>
            <input type="text" class="form-control" [(ngModel)]="cloneForm.name" placeholder="Ej: Cajero - Sucursal Centro">
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeCloneModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveClone()">Clonar Rol</button>
        </div>
      </div>
    </div>
  `
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  tenants: Tenant[] = [];
  permissions: Permission[] = [];
  permissionsByModule: Record<string, Permission[]> = {};
  moduleNames: string[] = [];

  filterTenantId: number | undefined = undefined;

  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;
  selectedKeys = new Set<string>();

  form: CreateRoleDto = {
    tenantId: undefined,
    name: '',
    defaultLandingRoute: '',
    permissionKeys: []
  };

  isCloneModalOpen = false;
  cloningRole: Role | undefined;
  cloneForm: CloneRoleDto = { tenantId: 0, name: '' };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getTenants().subscribe({ next: t => this.tenants = t });
    this.apiService.getPermissions().subscribe({
      next: perms => {
        this.permissions = perms;
        this.permissionsByModule = {};
        for (const p of perms) {
          if (!this.permissionsByModule[p.module]) this.permissionsByModule[p.module] = [];
          this.permissionsByModule[p.module].push(p);
        }
        this.moduleNames = Object.keys(this.permissionsByModule).sort();
      },
      error: err => console.error('Error al cargar permisos:', err)
    });
    this.loadRoles();
  }

  get hasSystemTemplates(): boolean {
    return this.roles.some(r => r.isSystemTemplate);
  }

  loadRoles(): void {
    this.apiService.getRoles(this.filterTenantId).subscribe({
      next: data => this.roles = data,
      error: err => console.error('Error al cargar roles:', err)
    });
  }

  isModuleFullySelected(module: string): boolean {
    const perms = this.permissionsByModule[module] || [];
    return perms.length > 0 && perms.every(p => this.selectedKeys.has(p.key));
  }

  toggleModule(module: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const perms = this.permissionsByModule[module] || [];
    for (const p of perms) {
      if (checked) this.selectedKeys.add(p.key);
      else this.selectedKeys.delete(p.key);
    }
  }

  togglePermission(key: string): void {
    if (this.selectedKeys.has(key)) this.selectedKeys.delete(key);
    else this.selectedKeys.add(key);
  }

  openCreateModal(): void {
    if (!this.filterTenantId) return;
    this.isEditing = false;
    this.editingId = null;
    this.selectedKeys = new Set<string>();
    this.form = {
      tenantId: this.filterTenantId,
      name: '',
      defaultLandingRoute: '',
      permissionKeys: []
    };
    this.isModalOpen = true;
  }

  openEditModal(role: Role): void {
    this.isEditing = true;
    this.editingId = role.id;
    this.selectedKeys = new Set<string>(role.permissionKeys);
    this.form = {
      tenantId: role.tenantId,
      name: role.name,
      defaultLandingRoute: role.defaultLandingRoute || '',
      permissionKeys: []
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveRole(): void {
    if (!this.form.name) {
      alert('Por favor ingresa el nombre del rol.');
      return;
    }
    const permissionKeys = Array.from(this.selectedKeys);

    if (this.isEditing && this.editingId) {
      const dto: UpdateRoleDto = {
        name: this.form.name,
        defaultLandingRoute: this.form.defaultLandingRoute || undefined,
        permissionKeys
      };
      this.apiService.updateRole(this.editingId, dto).subscribe({
        next: () => { this.closeModal(); this.loadRoles(); },
        error: err => alert('Error al actualizar rol: ' + (err.error?.message || err.message))
      });
    } else {
      const dto: CreateRoleDto = {
        ...this.form,
        defaultLandingRoute: this.form.defaultLandingRoute || undefined,
        permissionKeys
      };
      this.apiService.createRole(dto).subscribe({
        next: () => { this.closeModal(); this.loadRoles(); },
        error: err => alert('Error al crear rol: ' + (err.error?.message || err.message))
      });
    }
  }

  deleteRole(role: Role): void {
    if (confirm(`¿Eliminar el rol "${role.name}"?`)) {
      this.apiService.deleteRole(role.id).subscribe({
        next: () => this.loadRoles(),
        error: err => alert('Error al eliminar rol: ' + (err.error?.message || err.message))
      });
    }
  }

  openCloneModal(role: Role): void {
    this.cloningRole = role;
    this.cloneForm = { tenantId: this.tenants[0]?.id ?? 0, name: `${role.name} (copia)` };
    this.isCloneModalOpen = true;
  }

  closeCloneModal(): void {
    this.isCloneModalOpen = false;
  }

  saveClone(): void {
    if (!this.cloningRole) return;
    if (!this.cloneForm.tenantId || !this.cloneForm.name) {
      alert('Completa el tenant destino y el nombre del nuevo rol.');
      return;
    }
    this.apiService.cloneRole(this.cloningRole.id, this.cloneForm).subscribe({
      next: () => { this.closeCloneModal(); this.loadRoles(); },
      error: err => alert('Error al clonar rol: ' + (err.error?.message || err.message))
    });
  }
}

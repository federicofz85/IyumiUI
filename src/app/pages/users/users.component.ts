import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AppUser, CreateUserDto, UpdateUserDto, SetPasswordDto, Tenant, Role } from '../../models/system.models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card-panel">
      <div class="card-header-actions">
        <div>
          <h2>👤 Usuarios</h2>
          <p style="color: var(--text-muted); font-size: 13px;">Altas, roles asignados y estado de cada usuario del sistema.</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <select class="form-control" style="width: 220px;" [(ngModel)]="filterTenantId" (change)="loadUsers()">
            <option [ngValue]="undefined">— Todos los Tenants —</option>
            <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
          </select>
          <button class="btn btn-primary" (click)="openCreateModal()">
            <span>➕</span> Nuevo Usuario
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Tenant</th>
              <th>Roles</th>
              <th>Estado</th>
              <th>SuperAdmin</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users">
              <td><code style="font-size: 12px;">{{ u.email }}</code></td>
              <td><strong>{{ u.displayName }}</strong></td>
              <td>
                <span class="badge badge-info" *ngIf="u.tenantId; else globalBadge">{{ getTenantName(u.tenantId) }}</span>
                <ng-template #globalBadge><span class="badge badge-info">Global (SuperAdmin)</span></ng-template>
              </td>
              <td>
                <span class="badge badge-success" style="margin-right: 4px;" *ngFor="let r of u.roles">{{ r.name }}</span>
                <span *ngIf="u.roles.length === 0" style="color: var(--text-dim);">—</span>
              </td>
              <td>
                <span class="badge" [ngClass]="u.active ? 'badge-success' : 'badge-danger'">{{ u.active ? 'Activo' : 'Inactivo' }}</span>
              </td>
              <td>
                <span class="badge" [ngClass]="u.isSuperAdmin ? 'badge-success' : 'badge-danger'">{{ u.isSuperAdmin ? 'Sí' : 'No' }}</span>
              </td>
              <td>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" (click)="openEditModal(u)">✏️ Editar</button>
                  <button class="btn btn-secondary btn-sm" (click)="openPasswordModal(u)">🔑</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteUser(u)">🗑️</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="users.length === 0">
              <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No hay usuarios registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Crear/Editar Usuario -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Tenant</label>
            <select class="form-control" [(ngModel)]="form.tenantId" (change)="onFormTenantChange()" [disabled]="isEditing">
              <option [ngValue]="undefined">— Ninguno (SuperAdmin global) —</option>
              <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
            </select>
          </div>

          <div class="form-group" *ngIf="!isEditing">
            <label class="form-label">Email *</label>
            <input type="email" class="form-control" [(ngModel)]="form.email" placeholder="usuario@empresa.com">
          </div>

          <div class="form-group" *ngIf="!isEditing">
            <label class="form-label">Contraseña *</label>
            <input type="password" class="form-control" [(ngModel)]="form.password" placeholder="Mínimo 6 caracteres">
          </div>

          <div class="form-group">
            <label class="form-label">Nombre para Mostrar *</label>
            <input type="text" class="form-control" [(ngModel)]="form.displayName" placeholder="Ej: Juan Pérez">
          </div>

          <div style="margin-bottom: 16px;">
            <label class="form-check">
              <input type="checkbox" [(ngModel)]="form.active">
              <span>Usuario Activo</span>
            </label>
            <label class="form-check">
              <input type="checkbox" [(ngModel)]="form.isSuperAdmin">
              <span>Es SuperAdmin</span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-label">Roles</label>
            <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px; max-height: 180px; overflow-y: auto;">
              <label class="form-check" style="margin-bottom: 6px;" *ngFor="let r of availableRoles">
                <input type="checkbox" [checked]="form.roleIds.includes(r.id)" (change)="toggleRole(r.id)">
                <span>{{ r.name }} <small style="color: var(--text-dim);" *ngIf="r.isSystemTemplate">(plantilla)</small></span>
              </label>
              <div *ngIf="availableRoles.length === 0" style="color: var(--text-dim); font-size: 13px;">No hay roles disponibles para este tenant.</div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveUser()">
            {{ isEditing ? 'Guardar Cambios' : 'Crear Usuario' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Cambiar Contraseña -->
    <div class="modal-backdrop" *ngIf="isPasswordModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Cambiar Contraseña de {{ passwordUser?.displayName }}</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closePasswordModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Nueva Contraseña *</label>
            <input type="password" class="form-control" [(ngModel)]="passwordForm.newPassword" placeholder="Mínimo 6 caracteres">
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closePasswordModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="savePassword()">Actualizar Contraseña</button>
        </div>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  users: AppUser[] = [];
  tenants: Tenant[] = [];
  availableRoles: Role[] = [];

  filterTenantId: number | undefined = undefined;

  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;

  form: CreateUserDto = {
    tenantId: undefined,
    email: '',
    password: '',
    displayName: '',
    active: true,
    isSuperAdmin: false,
    roleIds: []
  };

  isPasswordModalOpen = false;
  passwordUser: AppUser | undefined;
  passwordForm: SetPasswordDto = { newPassword: '' };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getTenants().subscribe({ next: t => this.tenants = t });
    this.loadUsers();
  }

  loadUsers(): void {
    this.apiService.getUsers(this.filterTenantId).subscribe({
      next: data => this.users = data,
      error: err => console.error('Error al cargar usuarios:', err)
    });
  }

  getTenantName(tenantId: number | undefined): string {
    if (!tenantId) return '—';
    const t = this.tenants.find(x => x.id === tenantId);
    return t ? t.name : `#${tenantId}`;
  }

  loadAvailableRoles(tenantId: number | undefined): void {
    this.apiService.getRoles(tenantId).subscribe({
      next: data => this.availableRoles = data,
      error: err => console.error('Error al cargar roles:', err)
    });
  }

  onFormTenantChange(): void {
    this.form.roleIds = [];
    this.loadAvailableRoles(this.form.tenantId);
  }

  toggleRole(roleId: number): void {
    const idx = this.form.roleIds.indexOf(roleId);
    if (idx >= 0) this.form.roleIds.splice(idx, 1);
    else this.form.roleIds.push(roleId);
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.form = {
      tenantId: this.filterTenantId,
      email: '',
      password: '',
      displayName: '',
      active: true,
      isSuperAdmin: false,
      roleIds: []
    };
    this.loadAvailableRoles(this.form.tenantId);
    this.isModalOpen = true;
  }

  openEditModal(user: AppUser): void {
    this.isEditing = true;
    this.editingId = user.id;
    this.form = {
      tenantId: user.tenantId,
      email: user.email,
      password: '',
      displayName: user.displayName,
      active: user.active,
      isSuperAdmin: user.isSuperAdmin,
      roleIds: user.roles.map(r => r.id)
    };
    this.loadAvailableRoles(user.tenantId);
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveUser(): void {
    if (this.isEditing && this.editingId) {
      if (!this.form.displayName) {
        alert('Por favor ingresa el nombre a mostrar.');
        return;
      }
      const dto: UpdateUserDto = {
        displayName: this.form.displayName,
        active: this.form.active,
        isSuperAdmin: this.form.isSuperAdmin,
        roleIds: this.form.roleIds
      };
      this.apiService.updateUser(this.editingId, dto).subscribe({
        next: () => { this.closeModal(); this.loadUsers(); },
        error: err => alert('Error al actualizar usuario: ' + (err.error?.message || err.message))
      });
    } else {
      if (!this.form.email || !this.form.password || !this.form.displayName) {
        alert('Por favor completa email, contraseña y nombre a mostrar.');
        return;
      }
      this.apiService.createUser(this.form).subscribe({
        next: () => { this.closeModal(); this.loadUsers(); },
        error: err => alert('Error al crear usuario: ' + (err.error?.message || err.message))
      });
    }
  }

  deleteUser(user: AppUser): void {
    if (confirm(`¿Eliminar al usuario "${user.email}"?`)) {
      this.apiService.deleteUser(user.id).subscribe({
        next: () => this.loadUsers(),
        error: err => alert('Error al eliminar usuario: ' + (err.error?.message || err.message))
      });
    }
  }

  openPasswordModal(user: AppUser): void {
    this.passwordUser = user;
    this.passwordForm = { newPassword: '' };
    this.isPasswordModalOpen = true;
  }

  closePasswordModal(): void {
    this.isPasswordModalOpen = false;
  }

  savePassword(): void {
    if (!this.passwordUser) return;
    if (!this.passwordForm.newPassword || this.passwordForm.newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    this.apiService.setUserPassword(this.passwordUser.id, this.passwordForm).subscribe({
      next: () => { this.closePasswordModal(); alert('Contraseña actualizada.'); },
      error: err => alert('Error al actualizar contraseña: ' + (err.error?.message || err.message))
    });
  }
}

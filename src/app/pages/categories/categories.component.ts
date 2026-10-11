import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Category, CreateCategoryDto, CategoryTreeNode, Tenant } from '../../models/system.models';
import { CategoryNodeComponent } from './category-node.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, CategoryNodeComponent],
  template: `
    <div class="card-panel">
      <div class="card-header-actions">
        <div>
          <h2>📂 Categorías</h2>
          <p style="color: var(--text-muted); font-size: 13px;">Árbol de categorías y subcategorías (niveles ilimitados) por tenant.</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <select class="form-control" style="width: 220px;" [(ngModel)]="tenantId" (change)="loadTree()">
            <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
          </select>
          <button class="btn btn-primary" (click)="openCreateModal()" [disabled]="!tenantId">
            <span>➕</span> Nueva Categoría Raíz
          </button>
        </div>
      </div>

      <div *ngIf="tree.length === 0" style="text-align: center; color: var(--text-muted); padding: 40px;">
        <div style="font-size: 32px; margin-bottom: 8px;">📂</div>
        No hay categorías registradas para este tenant.
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <app-category-node
          *ngFor="let node of tree"
          [node]="node"
          (edit)="openEditModal($event)"
          (delete)="deleteCategory($event)"
          (addChild)="openCreateModal($event.id)">
        </app-category-node>
      </div>
    </div>

    <!-- Modal Form -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Editar Categoría' : 'Nueva Categoría' }}</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre de la Categoría *</label>
            <input type="text" class="form-control" [(ngModel)]="form.name" placeholder="Ej: Bebidas">
          </div>

          <div class="form-group">
            <label class="form-label">Categoría Padre</label>
            <select class="form-control" [(ngModel)]="form.parentCategoryId">
              <option [ngValue]="undefined">— Raíz (sin categoría padre) —</option>
              <option *ngFor="let c of flatCategories" [ngValue]="c.id" [disabled]="isEditing && c.id === editingId">{{ c.name }}</option>
            </select>
          </div>

          <label class="form-check">
            <input type="checkbox" [(ngModel)]="form.active">
            <span>Categoría Activa</span>
          </label>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveCategory()">
            {{ isEditing ? 'Guardar Cambios' : 'Crear Categoría' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class CategoriesComponent implements OnInit {
  tenants: Tenant[] = [];
  tenantId: number | undefined = undefined;
  tree: CategoryTreeNode[] = [];
  flatCategories: Category[] = [];

  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;

  form: CreateCategoryDto = {
    tenantId: 0,
    parentCategoryId: undefined,
    name: '',
    active: true
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getTenants().subscribe({
      next: data => {
        this.tenants = data;
        this.tenantId = data[0]?.id;
        this.loadTree();
      },
      error: err => console.error('Error al cargar tenants:', err)
    });
  }

  loadTree(): void {
    if (!this.tenantId) return;
    this.apiService.getCategoryTree(this.tenantId).subscribe({
      next: data => this.tree = data,
      error: err => console.error('Error al cargar árbol de categorías:', err)
    });
    this.apiService.getCategories(this.tenantId).subscribe({
      next: data => this.flatCategories = data,
      error: err => console.error('Error al cargar categorías:', err)
    });
  }

  openCreateModal(parentCategoryId?: number): void {
    if (!this.tenantId) return;
    this.isEditing = false;
    this.editingId = null;
    this.form = {
      tenantId: this.tenantId,
      parentCategoryId,
      name: '',
      active: true
    };
    this.isModalOpen = true;
  }

  openEditModal(node: CategoryTreeNode): void {
    const full = this.flatCategories.find(c => c.id === node.id);
    this.isEditing = true;
    this.editingId = node.id;
    this.form = {
      tenantId: this.tenantId!,
      parentCategoryId: full?.parentCategoryId,
      name: node.name,
      active: node.active
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveCategory(): void {
    if (!this.form.name) {
      alert('Por favor ingresa el nombre de la categoría.');
      return;
    }

    if (this.isEditing && this.editingId) {
      this.apiService.updateCategory(this.editingId, this.form).subscribe({
        next: () => { this.closeModal(); this.loadTree(); },
        error: err => alert('Error al actualizar categoría: ' + (err.error?.message || err.message))
      });
    } else {
      this.apiService.createCategory(this.form).subscribe({
        next: () => { this.closeModal(); this.loadTree(); },
        error: err => alert('Error al crear categoría: ' + (err.error?.message || err.message))
      });
    }
  }

  deleteCategory(node: CategoryTreeNode): void {
    if (confirm(`¿Eliminar la categoría "${node.name}"? Esto puede fallar si tiene subcategorías o productos asociados.`)) {
      this.apiService.deleteCategory(node.id).subscribe({
        next: () => this.loadTree(),
        error: err => alert('Error al eliminar categoría: ' + (err.error?.message || err.message))
      });
    }
  }
}

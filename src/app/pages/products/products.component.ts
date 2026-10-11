import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Product, CreateProductDto, Tenant, Category } from '../../models/system.models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="card-panel">
      <div class="card-header-actions">
        <div>
          <h2>Catálogo de Productos</h2>
          <p style="color: var(--text-muted); font-size: 13px;">Gestión de productos del catálogo. Los productos son pesables o no y pueden tener imagen.</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <select class="form-control" style="width: 220px;" [(ngModel)]="filterTenantId" (change)="loadProducts()">
            <option [ngValue]="undefined">— Todos los Tenants —</option>
            <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
          </select>
          <button class="btn btn-primary" (click)="openCreateModal()">
            <span>➕</span> Nuevo Producto
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Tenant</th>
              <th>Categoría</th>
              <th>Pesable</th>
              <th>Stock Total</th>
              <th>Valor Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of products">
              <td>#{{ p.id }}</td>
              <td>
                <div *ngIf="p.imageUrl; else noImg" style="width:40px; height:40px; border-radius:8px; overflow:hidden; border: 1px solid var(--border-color);">
                  <img [src]="p.imageUrl" alt="img" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <ng-template #noImg>
                  <div style="width:40px; height:40px; border-radius:8px; background: rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; font-size:18px;">📦</div>
                </ng-template>
              </td>
              <td><strong>{{ p.name }}</strong></td>
              <td style="color: var(--text-muted); max-width: 200px; white-space: nowrap; overflow:hidden; text-overflow:ellipsis;">{{ p.description || '—' }}</td>
              <td>
                <span class="badge badge-info">{{ getTenantName(p.tenantId) }}</span>
              </td>
              <td style="color: var(--text-muted);">{{ p.categoryName || '—' }}</td>
              <td>
                <span class="badge" [ngClass]="p.isWeighable ? 'badge-success' : 'badge-danger'">
                  {{ p.isWeighable ? '⚖️ Sí' : '📦 No' }}
                </span>
              </td>
              <td><strong>{{ getProductTotalStock(p) }}</strong></td>
              <td><strong style="color: var(--accent);">$ {{ getProductTotalValue(p) | number:'1.2-2' }}</strong></td>
              <td>
                <span class="badge" [ngClass]="p.active ? 'badge-success' : 'badge-danger'">
                  {{ p.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div style="display: flex; gap: 8px;">
                  <a class="btn btn-secondary btn-sm" [routerLink]="['/admin/product-variants']" [queryParams]="{productId: p.id}">🏷️ Variantes</a>
                  <button class="btn btn-secondary btn-sm" (click)="openEditModal(p)">✏️ Editar</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteProduct(p.id)">🗑️</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="products.length === 0">
              <td colspan="11" style="text-align: center; color: var(--text-muted); padding: 40px;">
                <div style="font-size: 32px; margin-bottom: 8px;">📦</div>
                No hay productos registrados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Editar Producto' : 'Crear Nuevo Producto' }}</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Tenant</label>
            <select class="form-control" [(ngModel)]="form.tenantId" (change)="onFormTenantChange()">
              <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Categoría</label>
            <select class="form-control" [(ngModel)]="form.categoryId">
              <option [ngValue]="undefined">— Sin Categoría —</option>
              <option *ngFor="let c of formCategories" [ngValue]="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Nombre del Producto</label>
            <input type="text" class="form-control" [(ngModel)]="form.name" placeholder="Ej: Coca-Cola 2.5L">
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea class="form-control" [(ngModel)]="form.description" rows="3" placeholder="Descripción opcional del producto..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">URL de Imagen</label>
            <input type="url" class="form-control" [(ngModel)]="form.imageUrl" placeholder="https://...">
            <div *ngIf="form.imageUrl" style="margin-top: 8px; border-radius: 8px; overflow: hidden; max-width: 100px;">
              <img [src]="form.imageUrl" style="width:100%; border-radius: 8px;" alt="preview">
            </div>
          </div>

          <div style="margin-top: 16px;">
            <label class="form-check">
              <input type="checkbox" [(ngModel)]="form.isWeighable">
              <span>Producto Pesable (se vende por kg/g)</span>
            </label>

            <label class="form-check">
              <input type="checkbox" [(ngModel)]="form.active">
              <span>Producto Activo</span>
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveProduct()">
            {{ isEditing ? 'Guardar Cambios' : 'Crear Producto' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  tenants: Tenant[] = [];
  formCategories: Category[] = [];
  filterTenantId: number | undefined = undefined;
  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;

  form: CreateProductDto = {
    tenantId: 0,
    categoryId: undefined,
    name: '',
    description: '',
    isWeighable: false,
    imageUrl: '',
    active: true
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.apiService.getTenants().subscribe({
      next: data => {
        this.tenants = data;
        this.loadProducts();
      },
      error: err => console.error('Error al cargar tenants:', err)
    });
  }

  loadProducts(): void {
    this.apiService.getProducts(this.filterTenantId).subscribe({
      next: data => this.products = data,
      error: err => console.error('Error al cargar productos:', err)
    });
  }

  getTenantName(tenantId: number): string {
    const t = this.tenants.find(x => x.id === tenantId);
    return t ? t.name : `#${tenantId}`;
  }

  getProductTotalStock(p: Product): number {
    return (p.variants ?? []).flatMap(v => v.stocks ?? []).reduce((a, s) => a + s.quantity, 0);
  }

  getProductTotalValue(p: Product): number {
    return (p.variants ?? []).flatMap(v => v.stocks ?? []).reduce((a, s) => a + (s.quantity * (s.averageCost || 0)), 0);
  }

  onFormTenantChange(): void {
    this.form.categoryId = undefined;
    this.apiService.getCategories(this.form.tenantId).subscribe({
      next: data => this.formCategories = data,
      error: err => console.error('Error al cargar categorías:', err)
    });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.form = {
      tenantId: this.tenants[0]?.id ?? 0,
      categoryId: undefined,
      name: '',
      description: '',
      isWeighable: false,
      imageUrl: '',
      active: true
    };
    this.onFormTenantChange();
    this.isModalOpen = true;
  }

  openEditModal(product: Product): void {
    this.isEditing = true;
    this.editingId = product.id;
    this.form = {
      tenantId: product.tenantId,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description || '',
      isWeighable: product.isWeighable,
      imageUrl: product.imageUrl || '',
      active: product.active
    };
    this.apiService.getCategories(product.tenantId).subscribe({
      next: data => this.formCategories = data,
      error: err => console.error('Error al cargar categorías:', err)
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveProduct(): void {
    if (!this.form.name) {
      alert('Por favor ingresa el nombre del producto.');
      return;
    }

    if (this.isEditing && this.editingId) {
      this.apiService.updateProduct(this.editingId, this.form).subscribe({
        next: () => { this.closeModal(); this.loadProducts(); },
        error: err => alert('Error al actualizar producto: ' + err.message)
      });
    } else {
      this.apiService.createProduct(this.form).subscribe({
        next: () => { this.closeModal(); this.loadProducts(); },
        error: err => alert('Error al crear producto: ' + err.message)
      });
    }
  }

  deleteProduct(id: number): void {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.apiService.deleteProduct(id).subscribe({
        next: () => this.loadProducts(),
        error: err => alert('Error al eliminar producto: ' + err.message)
      });
    }
  }
}

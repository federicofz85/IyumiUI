import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectOnFocusDirective } from '../../directives/select-on-focus.directive';
import { ApiService } from '../../services/api.service';
import {
  ProductAttribute, CreateProductAttributeDto, Tenant,
  AttributeDisplayType, AttributeDisplayTypeOptions,
  ProductAttributeOption, CreateProductAttributeOptionDto, UpdateProductAttributeOptionDto
} from '../../models/system.models';

@Component({
  selector: 'app-product-attributes',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectOnFocusDirective],
  template: `
    <div class="card-panel">
      <div class="card-header-actions">
        <div>
          <h2>🎨 Atributos de Producto</h2>
          <p style="color: var(--text-muted); font-size: 13px;">Define atributos (Color, Talle, Material, etc.) de texto libre o con lista de opciones reutilizables.</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <select class="form-control" style="width: 220px;" [(ngModel)]="filterTenantId" (change)="loadAttributes()">
            <option [ngValue]="undefined">— Todos los Tenants —</option>
            <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
          </select>
          <button class="btn btn-primary" (click)="openCreateModal()">
            <span>➕</span> Nuevo Atributo
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tenant</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of attributes">
              <td>#{{ a.id }}</td>
              <td><span class="badge badge-info">{{ getTenantName(a.tenantId) }}</span></td>
              <td><strong>{{ a.name }}</strong></td>
              <td>{{ getDisplayTypeLabel(a.displayType) }}</td>
              <td>
                <span class="badge" [ngClass]="a.active ? 'badge-success' : 'badge-danger'">
                  {{ a.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" *ngIf="a.displayType !== 'FreeText'" (click)="openOptionsModal(a)">⚙️ Opciones</button>
                  <button class="btn btn-secondary btn-sm" (click)="openEditModal(a)">✏️ Editar</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteAttribute(a.id)">🗑️</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="attributes.length === 0">
              <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No hay atributos registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form: Atributo -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Editar Atributo' : 'Nuevo Atributo de Producto' }}</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group" *ngIf="!isEditing">
            <label class="form-label">Tenant *</label>
            <select class="form-control" [(ngModel)]="form.tenantId">
              <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Nombre del Atributo *</label>
            <input type="text" class="form-control" [(ngModel)]="form.name" placeholder="Ej: Color, Talle, Material">
          </div>

          <div class="form-group">
            <label class="form-label">Tipo de Atributo *</label>
            <select class="form-control" [(ngModel)]="form.displayType">
              <option *ngFor="let o of displayTypeOptions" [ngValue]="o.value">{{ o.label }}</option>
            </select>
            <small style="color: var(--text-dim);">"Lista de Colores" permite asignar un código hex a cada opción (ej. Rojo = #FF0000).</small>
          </div>

          <label class="form-check">
            <input type="checkbox" [(ngModel)]="form.active">
            <span>Atributo Activo</span>
          </label>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveAttribute()">
            {{ isEditing ? 'Guardar Cambios' : 'Crear Atributo' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Opciones del atributo -->
    <div class="modal-backdrop" *ngIf="isOptionsModalOpen">
      <div class="modal-card" style="max-width: 560px;">
        <div class="modal-header">
          <h3>Opciones de "{{ optionsAttribute?.name }}"</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeOptionsModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Valor</th>
                  <th *ngIf="optionsAttribute?.displayType === 'Color'">Color</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let o of options">
                  <td><strong>{{ o.value }}</strong></td>
                  <td *ngIf="optionsAttribute?.displayType === 'Color'">
                    <span style="display:flex; align-items:center; gap:8px;">
                      <span style="width:16px; height:16px; border-radius:50%; display:inline-block; border:1px solid rgba(255,255,255,0.3);" [style.background]="o.hexColor || '#333'"></span>
                      <code style="font-size:12px; color: var(--text-muted);">{{ o.hexColor || '—' }}</code>
                    </span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="o.active ? 'badge-success' : 'badge-danger'">{{ o.active ? 'Activa' : 'Inactiva' }}</span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-secondary btn-sm" (click)="openEditOptionModal(o)">✏️</button>
                      <button class="btn btn-danger btn-sm" (click)="deleteOption(o)">🗑️</button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="options.length === 0">
                  <td [attr.colspan]="optionsAttribute?.displayType === 'Color' ? 4 : 3" style="text-align:center; color: var(--text-muted); padding: 16px;">
                    No hay opciones cargadas todavía.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <button class="btn btn-primary btn-sm" style="margin-top: 16px;" (click)="openCreateOptionModal()">➕ Nueva Opción</button>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeOptionsModal()">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal: Crear/Editar Opción -->
    <div class="modal-backdrop" *ngIf="isOptionFormOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditingOption ? 'Editar Opción' : 'Nueva Opción' }}</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeOptionForm()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Valor / Etiqueta *</label>
            <input type="text" class="form-control" [(ngModel)]="optionForm.value" placeholder="Ej: Rojo, M, Algodón">
          </div>

          <div class="form-group" *ngIf="optionsAttribute?.displayType === 'Color'">
            <label class="form-label">Color</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <input type="color" [(ngModel)]="optionForm.hexColor" style="width:48px; height:40px; padding:2px; border-radius:8px; border:1px solid var(--border-color); background:transparent; cursor:pointer;">
              <input type="text" class="form-control" [(ngModel)]="optionForm.hexColor" placeholder="#FF0000">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Orden</label>
            <input type="number" selectOnFocus class="form-control" [(ngModel)]="optionForm.sortOrder" min="0">
          </div>

          <label class="form-check">
            <input type="checkbox" [(ngModel)]="optionForm.active">
            <span>Opción Activa</span>
          </label>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeOptionForm()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveOption()">
            {{ isEditingOption ? 'Guardar Cambios' : 'Crear Opción' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProductAttributesComponent implements OnInit {
  attributes: ProductAttribute[] = [];
  tenants: Tenant[] = [];
  filterTenantId: number | undefined = undefined;
  displayTypeOptions = AttributeDisplayTypeOptions;

  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;

  form: CreateProductAttributeDto = {
    tenantId: 0,
    name: '',
    displayType: AttributeDisplayType.FreeText,
    active: true
  };

  isOptionsModalOpen = false;
  optionsAttribute: ProductAttribute | undefined = undefined;
  options: ProductAttributeOption[] = [];

  isOptionFormOpen = false;
  isEditingOption = false;
  editingOptionId: number | null = null;
  optionForm: CreateProductAttributeOptionDto = {
    tenantId: 0, attributeId: 0, value: '', hexColor: '#6366f1', sortOrder: 0, active: true
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getTenants().subscribe({
      next: data => {
        this.tenants = data;
        this.loadAttributes();
      },
      error: err => console.error('Error al cargar tenants:', err)
    });
  }

  loadAttributes(): void {
    this.apiService.getProductAttributes(this.filterTenantId).subscribe({
      next: data => this.attributes = data,
      error: err => console.error('Error al cargar atributos:', err)
    });
  }

  getTenantName(tenantId: number): string {
    const t = this.tenants.find(x => x.id === tenantId);
    return t ? t.name : `#${tenantId}`;
  }

  getDisplayTypeLabel(type: AttributeDisplayType): string {
    return this.displayTypeOptions.find(o => o.value === type)?.label ?? type;
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.form = {
      tenantId: this.filterTenantId ?? this.tenants[0]?.id ?? 0,
      name: '',
      displayType: AttributeDisplayType.FreeText,
      active: true
    };
    this.isModalOpen = true;
  }

  openEditModal(attribute: ProductAttribute): void {
    this.isEditing = true;
    this.editingId = attribute.id;
    this.form = {
      tenantId: attribute.tenantId,
      name: attribute.name,
      displayType: attribute.displayType,
      active: attribute.active
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveAttribute(): void {
    if (!this.form.name) {
      alert('Por favor ingresa el nombre del atributo.');
      return;
    }

    if (this.isEditing && this.editingId) {
      this.apiService.updateProductAttribute(this.editingId, this.form).subscribe({
        next: () => { this.closeModal(); this.loadAttributes(); },
        error: err => alert('Error al actualizar atributo: ' + (err.error?.message || err.message))
      });
    } else {
      this.apiService.createProductAttribute(this.form).subscribe({
        next: () => { this.closeModal(); this.loadAttributes(); },
        error: err => alert('Error al crear atributo: ' + (err.error?.message || err.message))
      });
    }
  }

  deleteAttribute(id: number): void {
    if (confirm('¿Estás seguro de eliminar este atributo?')) {
      this.apiService.deleteProductAttribute(id).subscribe({
        next: () => this.loadAttributes(),
        error: err => alert('Error al eliminar atributo: ' + (err.error?.message || err.message))
      });
    }
  }

  openOptionsModal(attribute: ProductAttribute): void {
    this.optionsAttribute = attribute;
    this.loadOptions();
    this.isOptionsModalOpen = true;
  }

  closeOptionsModal(): void {
    this.isOptionsModalOpen = false;
  }

  loadOptions(): void {
    if (!this.optionsAttribute) return;
    this.apiService.getAttributeOptions(this.optionsAttribute.id, this.optionsAttribute.tenantId).subscribe({
      next: data => this.options = data,
      error: err => console.error('Error al cargar opciones:', err)
    });
  }

  openCreateOptionModal(): void {
    if (!this.optionsAttribute) return;
    this.isEditingOption = false;
    this.editingOptionId = null;
    this.optionForm = {
      tenantId: this.optionsAttribute.tenantId,
      attributeId: this.optionsAttribute.id,
      value: '',
      hexColor: '#6366f1',
      sortOrder: this.options.length,
      active: true
    };
    this.isOptionFormOpen = true;
  }

  openEditOptionModal(option: ProductAttributeOption): void {
    this.isEditingOption = true;
    this.editingOptionId = option.id;
    this.optionForm = {
      tenantId: option.tenantId,
      attributeId: option.attributeId,
      value: option.value,
      hexColor: option.hexColor || '#6366f1',
      sortOrder: option.sortOrder,
      active: option.active
    };
    this.isOptionFormOpen = true;
  }

  closeOptionForm(): void {
    this.isOptionFormOpen = false;
  }

  saveOption(): void {
    if (!this.optionsAttribute) return;
    if (!this.optionForm.value) {
      alert('Ingresa el valor de la opción.');
      return;
    }

    const updateDto: UpdateProductAttributeOptionDto = {
      value: this.optionForm.value,
      hexColor: this.optionsAttribute.displayType === 'Color' ? this.optionForm.hexColor : undefined,
      sortOrder: this.optionForm.sortOrder,
      active: this.optionForm.active
    };

    if (this.isEditingOption && this.editingOptionId) {
      this.apiService.updateAttributeOption(this.optionsAttribute.id, this.editingOptionId, updateDto).subscribe({
        next: () => { this.closeOptionForm(); this.loadOptions(); },
        error: err => alert('Error al actualizar opción: ' + (err.error?.message || err.message))
      });
    } else {
      const createDto: CreateProductAttributeOptionDto = {
        ...this.optionForm,
        hexColor: this.optionsAttribute.displayType === 'Color' ? this.optionForm.hexColor : undefined
      };
      this.apiService.createAttributeOption(this.optionsAttribute.id, createDto).subscribe({
        next: () => { this.closeOptionForm(); this.loadOptions(); },
        error: err => alert('Error al crear opción: ' + (err.error?.message || err.message))
      });
    }
  }

  deleteOption(option: ProductAttributeOption): void {
    if (!this.optionsAttribute) return;
    if (confirm(`¿Eliminar la opción "${option.value}"?`)) {
      this.apiService.deleteAttributeOption(this.optionsAttribute.id, option.id).subscribe({
        next: () => this.loadOptions(),
        error: err => alert('Error al eliminar opción: ' + (err.error?.message || err.message))
      });
    }
  }
}

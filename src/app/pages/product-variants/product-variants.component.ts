import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectOnFocusDirective } from '../../directives/select-on-focus.directive';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import {
  ProductVariant, CreateProductVariantDto, Product, Tenant,
  ProductAttribute, VariantAttributeValue, ProductAttributeOption, SetVariantAttributeDto
} from '../../models/system.models';

@Component({
  selector: 'app-product-variants',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectOnFocusDirective, RouterLink],
  template: `
    <div class="card-panel">
      <div class="card-header-actions">
        <div>
          <h2>Variantes de Producto</h2>
          <p style="color: var(--text-muted); font-size: 13px;">
            SKUs, barcodes y precios por variante. Color, talle y demás características se gestionan como Atributos.
            <span *ngIf="filterProduct" style="margin-left: 8px;" class="badge badge-info">
              Filtrando: {{ filterProduct.name }}
              <a style="margin-left: 6px; cursor: pointer; color: #fff;" (click)="clearFilter()">✕</a>
            </span>
          </p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <select class="form-control" style="width: 180px;" [(ngModel)]="filterTenantId" (change)="onTenantFilterChange()">
            <option [ngValue]="undefined">— Todos los Tenants —</option>
            <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
          </select>
          <select class="form-control" style="width: 200px;" [(ngModel)]="filterProductId" (change)="loadVariants()">
            <option [ngValue]="undefined">— Todos los Productos —</option>
            <option *ngFor="let p of filteredProducts" [ngValue]="p.id">{{ p.name }}</option>
          </select>
          <button class="btn btn-primary" (click)="openCreateModal()">
            <span>➕</span> Nueva Variante
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Imagen</th>
              <th>Producto</th>
              <th>SKU</th>
              <th>Barcode</th>
              <th>Precio</th>
              <th>Margen</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of variants">
              <td>#{{ v.id }}</td>
              <td>
                <div *ngIf="v.imageUrl; else noImg" style="width:38px; height:38px; border-radius:8px; overflow:hidden; border: 1px solid var(--border-color);">
                  <img [src]="v.imageUrl" alt="img" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <ng-template #noImg>
                  <div style="width:38px; height:38px; border-radius:8px; background: rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; font-size:16px;">🏷️</div>
                </ng-template>
              </td>
              <td>
                <a class="badge badge-info" style="cursor:pointer;" [routerLink]="['/admin/products']">{{ getProductName(v.productId) }}</a>
              </td>
              <td><code style="background: rgba(255,255,255,0.07); padding: 3px 7px; border-radius: 6px; font-size: 12px;">{{ v.sku }}</code></td>
              <td style="color: var(--text-muted);">{{ v.barcode || '—' }}</td>
              <td><strong style="color: var(--accent);">$ {{ v.price | number:'1.2-2' }}</strong></td>
              <td>
                <strong *ngIf="getMargin(v) !== null" [style.color]="getMargin(v)! >= 0 ? 'var(--accent)' : 'var(--danger)'">
                  {{ getMargin(v) | number:'1.1-1' }}%
                </strong>
                <span *ngIf="getMargin(v) === null" style="color: var(--text-dim);">—</span>
              </td>
              <td>
                <span class="badge" [ngClass]="v.active ? 'badge-success' : 'badge-danger'">
                  {{ v.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <a class="btn btn-secondary btn-sm" [routerLink]="['/admin/inventory-stock']" [queryParams]="{variantId: v.id}">📈 Stock</a>
                  <a class="btn btn-secondary btn-sm" [routerLink]="['/admin/inventory-movements']" [queryParams]="{variantId: v.id}">📒 Kardex</a>
                  <button class="btn btn-secondary btn-sm" (click)="openAttributesModal(v)">🏷️ Atributos</button>
                  <button class="btn btn-secondary btn-sm" (click)="openEditModal(v)">✏️</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteVariant(v.id)">🗑️</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="variants.length === 0">
              <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 40px;">
                <div style="font-size: 32px; margin-bottom: 8px;">🏷️</div>
                No hay variantes registradas.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card" style="max-width: 620px;">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Editar Variante' : 'Nueva Variante de Producto' }}</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Tenant</label>
              <select class="form-control" [(ngModel)]="form.tenantId" (change)="onFormTenantChange()">
                <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Producto</label>
              <select class="form-control" [(ngModel)]="form.productId" (change)="onFormProductChange()">
                <option *ngFor="let p of formProducts" [ngValue]="p.id">{{ p.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">SKU *</label>
              <input type="text" class="form-control" [(ngModel)]="form.sku" placeholder="Ej: COCA-2.5L-RED">
            </div>

            <div class="form-group">
              <label class="form-label">Barcode / EAN</label>
              <input type="text" class="form-control" [(ngModel)]="form.barcode" placeholder="Ej: 7790895000789">
            </div>

            <div class="form-group">
              <label class="form-label">Precio de Venta *</label>
              <input type="number" selectOnFocus class="form-control" [(ngModel)]="form.price" min="0" step="0.01" placeholder="0.00">
            </div>

            <div class="form-group" *ngIf="tenantTracksCosts(form.tenantId)">
              <label class="form-label">Costo de Referencia</label>
              <input type="number" selectOnFocus class="form-control" [(ngModel)]="form.referenceCost" min="0" step="0.0001" placeholder="0.00">
              <small style="color: var(--text-dim);">Costo estimado para calcular margen. El costo real por depósito se calcula solo con las compras registradas en el Kardex.</small>
            </div>

            <div class="form-group">
              <label class="form-label">Variante Base (conversión de presentación)</label>
              <select class="form-control" [(ngModel)]="form.baseVariantId">
                <option [ngValue]="undefined">— Es unidad base —</option>
                <option *ngFor="let ov of otherVariantsOfProduct" [ngValue]="ov.id">{{ ov.sku }}</option>
              </select>
            </div>

            <div class="form-group" *ngIf="form.baseVariantId">
              <label class="form-label">Factor de Conversión</label>
              <input type="number" selectOnFocus class="form-control" [(ngModel)]="form.conversionFactor" min="0.000001" step="0.000001" placeholder="Ej: 6 (1 pack = 6 unidades base)">
            </div>

            <div class="form-group">
              <label class="form-label">URL de Imagen</label>
              <input type="url" class="form-control" [(ngModel)]="form.imageUrl" placeholder="https://...">
            </div>
          </div>

          <div style="margin-top: 16px;">
            <label class="form-check">
              <input type="checkbox" [(ngModel)]="form.active">
              <span>Variante Activa</span>
            </label>
          </div>

          <p style="color: var(--text-dim); font-size: 12px; margin-top: 8px;">
            Color, talle y demás características se asignan desde el botón "🏷️ Atributos" una vez creada la variante.
          </p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveVariant()">
            {{ isEditing ? 'Guardar Cambios' : 'Crear Variante' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Atributos -->
    <div class="modal-backdrop" *ngIf="isAttributesModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Atributos de {{ attributesVariant?.sku }}</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeAttributesModal()">✕</button>
        </div>

        <div class="modal-body">
          <div *ngIf="tenantAttributes.length === 0" style="color: var(--text-muted); text-align: center; padding: 20px;">
            No hay atributos definidos para este tenant. Crealos en la sección "Atributos".
          </div>

          <div class="form-group" *ngFor="let attr of tenantAttributes">
            <label class="form-label">{{ attr.name }}</label>

            <!-- Color: swatches -->
            <div *ngIf="attr.displayType === 'Color'" style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button type="button" *ngFor="let opt of attributeOptions[attr.id] || []"
                      (click)="attributeValues[attr.id] = opt.id"
                      [title]="opt.value"
                      style="display:flex; flex-direction:column; align-items:center; gap:4px; background:none; border:none; cursor:pointer; padding:4px;">
                <span [style.background]="opt.hexColor || '#333'"
                      [style.box-shadow]="attributeValues[attr.id] === opt.id ? '0 0 0 3px var(--primary)' : '0 0 0 1px rgba(255,255,255,0.25)'"
                      style="width:26px; height:26px; border-radius:50%; display:inline-block;"></span>
                <small style="color: var(--text-muted); font-size:11px;">{{ opt.value }}</small>
              </button>
              <div *ngIf="(attributeOptions[attr.id] || []).length === 0" style="color: var(--text-dim); font-size:12px;">
                Sin opciones cargadas — agregalas en "Atributos" → ⚙️ Opciones.
              </div>
            </div>

            <!-- Lista de opciones: select -->
            <select *ngIf="attr.displayType === 'OptionsList'" class="form-control" [(ngModel)]="attributeValues[attr.id]">
              <option [ngValue]="undefined">— Selecciona {{ attr.name }} —</option>
              <option *ngFor="let opt of attributeOptions[attr.id] || []" [ngValue]="opt.id">{{ opt.value }}</option>
            </select>

            <!-- Texto libre -->
            <input *ngIf="attr.displayType === 'FreeText'" type="text" class="form-control"
                   [(ngModel)]="attributeValues[attr.id]" [placeholder]="'Valor de ' + attr.name">
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeAttributesModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveAttributes()">Guardar Atributos</button>
        </div>
      </div>
    </div>
  `
})
export class ProductVariantsComponent implements OnInit {
  variants: ProductVariant[] = [];
  tenants: Tenant[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];
  formProducts: Product[] = [];
  formProductVariants: ProductVariant[] = [];
  filterTenantId: number | undefined = undefined;
  filterProductId: number | undefined = undefined;
  filterProduct: Product | undefined = undefined;
  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;

  isAttributesModalOpen = false;
  attributesVariant: ProductVariant | undefined = undefined;
  tenantAttributes: ProductAttribute[] = [];
  attributeOptions: { [attributeId: number]: ProductAttributeOption[] } = {};
  attributeValues: { [attributeId: number]: number | string | undefined } = {};

  form: CreateProductVariantDto = {
    tenantId: 0,
    productId: 0,
    sku: '',
    barcode: '',
    baseVariantId: undefined,
    conversionFactor: 1,
    price: 0,
    referenceCost: 0,
    imageUrl: '',
    active: true
  };

  get otherVariantsOfProduct(): ProductVariant[] {
    return this.formProductVariants.filter(v => v.id !== this.editingId);
  }

  constructor(private apiService: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['productId']) {
        this.filterProductId = +params['productId'];
      }
    });
    this.apiService.getTenants().subscribe({
      next: data => {
        this.tenants = data;
        this.apiService.getProducts().subscribe({
          next: prods => {
            this.products = prods;
            this.filteredProducts = prods;
            this.formProducts = prods;
            if (this.filterProductId) {
              this.filterProduct = prods.find(p => p.id === this.filterProductId);
            }
            this.loadVariants();
          }
        });
      }
    });
  }

  onTenantFilterChange(): void {
    this.filteredProducts = this.filterTenantId
      ? this.products.filter(p => p.tenantId === this.filterTenantId)
      : this.products;
    this.filterProductId = undefined;
    this.loadVariants();
  }

  clearFilter(): void {
    this.filterProductId = undefined;
    this.filterProduct = undefined;
    this.loadVariants();
  }

  loadVariants(): void {
    this.apiService.getProductVariants(this.filterTenantId, this.filterProductId).subscribe({
      next: data => this.variants = data,
      error: err => console.error('Error al cargar variantes:', err)
    });
  }

  tenantTracksCosts(tenantId: number): boolean {
    const t = this.tenants.find(x => x.id === tenantId);
    return t ? t.trackCosts !== false : true;
  }

  getMargin(v: ProductVariant): number | null {
    if (!this.tenantTracksCosts(v.tenantId)) return null;
    if (!v.price) return null;
    return ((v.price - (v.referenceCost || 0)) / v.price) * 100;
  }

  getProductName(productId: number): string {
    const p = this.products.find(x => x.id === productId);
    return p ? p.name : `Producto #${productId}`;
  }

  onFormTenantChange(): void {
    this.formProducts = this.form.tenantId
      ? this.products.filter(p => p.tenantId === this.form.tenantId)
      : this.products;
    this.form.productId = this.formProducts[0]?.id ?? 0;
    this.onFormProductChange();
  }

  onFormProductChange(): void {
    this.form.baseVariantId = undefined;
    this.formProductVariants = [];
    if (!this.form.productId) return;
    this.apiService.getProductVariants(undefined, this.form.productId).subscribe({
      next: data => this.formProductVariants = data,
      error: err => console.error('Error al cargar variantes del producto:', err)
    });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    const defaultTenantId = this.tenants[0]?.id ?? 0;
    this.formProducts = this.products.filter(p => p.tenantId === defaultTenantId);
    this.form = {
      tenantId: defaultTenantId,
      productId: this.filterProductId ?? this.formProducts[0]?.id ?? 0,
      sku: '',
      barcode: '',
      baseVariantId: undefined,
      conversionFactor: 1,
      price: 0,
      referenceCost: 0,
      imageUrl: '',
      active: true
    };
    this.onFormProductChange();
    this.isModalOpen = true;
  }

  openEditModal(variant: ProductVariant): void {
    this.isEditing = true;
    this.editingId = variant.id;
    this.formProducts = this.products.filter(p => p.tenantId === variant.tenantId);
    this.form = {
      tenantId: variant.tenantId,
      productId: variant.productId,
      sku: variant.sku,
      barcode: variant.barcode || '',
      baseVariantId: variant.baseVariantId,
      conversionFactor: variant.conversionFactor ?? 1,
      price: variant.price,
      referenceCost: variant.referenceCost ?? 0,
      imageUrl: variant.imageUrl || '',
      active: variant.active
    };
    this.onFormProductChange();
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  openAttributesModal(variant: ProductVariant): void {
    this.attributesVariant = variant;
    this.attributeValues = {};
    this.attributeOptions = {};

    this.apiService.getProductAttributes(variant.tenantId).subscribe({
      next: attrs => {
        this.tenantAttributes = attrs;
        attrs.filter(a => a.displayType !== 'FreeText').forEach(a => {
          this.apiService.getAttributeOptions(a.id, variant.tenantId).subscribe({
            next: opts => this.attributeOptions[a.id] = opts,
            error: err => console.error('Error al cargar opciones de ' + a.name + ':', err)
          });
        });
      },
      error: err => console.error('Error al cargar atributos:', err)
    });

    this.apiService.getVariantAttributes(variant.id, variant.tenantId).subscribe({
      next: (values: VariantAttributeValue[]) => {
        values.forEach(v => {
          this.attributeValues[v.attributeId] = v.optionId ?? v.value;
        });
      },
      error: err => console.error('Error al cargar valores de atributos:', err)
    });

    this.isAttributesModalOpen = true;
  }

  closeAttributesModal(): void {
    this.isAttributesModalOpen = false;
  }

  saveAttributes(): void {
    if (!this.attributesVariant) return;
    const payload: SetVariantAttributeDto[] = [];

    this.tenantAttributes.forEach(attr => {
      const val = this.attributeValues[attr.id];
      if (val === undefined || val === null || val === '') return;
      if (attr.displayType === 'FreeText') {
        payload.push({ attributeId: attr.id, value: String(val) });
      } else {
        payload.push({ attributeId: attr.id, optionId: Number(val) });
      }
    });

    this.apiService.setVariantAttributes(this.attributesVariant.id, this.attributesVariant.tenantId, payload).subscribe({
      next: () => this.closeAttributesModal(),
      error: err => alert('Error al guardar atributos: ' + (err.error?.message || err.message))
    });
  }

  saveVariant(): void {
    if (!this.form.sku || this.form.price === null) {
      alert('Por favor completa SKU y Precio.');
      return;
    }

    if (this.isEditing && this.editingId) {
      this.apiService.updateProductVariant(this.editingId, this.form).subscribe({
        next: () => { this.closeModal(); this.loadVariants(); },
        error: err => alert('Error al actualizar variante: ' + err.message)
      });
    } else {
      this.apiService.createProductVariant(this.form).subscribe({
        next: () => { this.closeModal(); this.loadVariants(); },
        error: err => alert('Error al crear variante: ' + err.message)
      });
    }
  }

  deleteVariant(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta variante?')) {
      this.apiService.deleteProductVariant(id).subscribe({
        next: () => this.loadVariants(),
        error: err => alert('Error al eliminar variante: ' + err.message)
      });
    }
  }
}

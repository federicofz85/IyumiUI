import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectOnFocusDirective } from '../../directives/select-on-focus.directive';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import {
  InventoryStock, SaveInventoryStockDto, RecordMovementDto,
  MovementType, MovementTypeOptions,
  Tenant, Warehouse, ProductVariant, Product
} from '../../models/system.models';
import { VariantPickerComponent } from '../../components/variant-picker/variant-picker.component';

@Component({
  selector: 'app-inventory-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectOnFocusDirective, VariantPickerComponent],
  template: `
    <div class="card-panel">
      <div class="card-header-actions">
        <div>
          <h2>📈 Inventario / Stock</h2>
          <p style="color: var(--text-muted); font-size: 13px;">Control de stock por variante y almacén. Cantidad disponible, reservada y valor a costo promedio.</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <select class="form-control" style="width: 180px;" [(ngModel)]="filterTenantId" (change)="onTenantFilterChange()">
            <option [ngValue]="undefined">— Todos los Tenants —</option>
            <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
          </select>
          <select class="form-control" style="width: 180px;" [(ngModel)]="filterWarehouseId" (change)="loadStock()">
            <option [ngValue]="undefined">— Todos los Almacenes —</option>
            <option *ngFor="let w of filteredWarehouses" [ngValue]="w.id">{{ w.name }}</option>
          </select>
          <button class="btn btn-primary" (click)="openMovementModal()">
            ➕ Registrar Stock
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Variante (SKU)</th>
              <th>Producto</th>
              <th>Almacén</th>
              <th>Tenant</th>
              <th>Cantidad</th>
              <th>Reservado</th>
              <th>Disponible</th>
              <th>Costo Prom.</th>
              <th>Valor</th>
              <th>Margen</th>
              <th>Última Act.</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of stock">
              <td>
                <code style="background: rgba(255,255,255,0.07); padding: 3px 8px; border-radius: 6px; font-size: 12px;">
                  {{ getVariantSku(s.variantId) }}
                </code>
              </td>
              <td style="color: var(--text-muted);">{{ getProductName(s.variantId) }}</td>
              <td>
                <span class="badge badge-info">{{ s.warehouseName || getWarehouseName(s.warehouseId) }}</span>
              </td>
              <td style="color: var(--text-muted);">{{ getTenantName(s.tenantId) }}</td>
              <td>
                <strong style="font-size: 16px;">{{ s.quantity }}</strong>
              </td>
              <td>
                <span style="color: var(--warning);">{{ s.reservedQuantity }}</span>
              </td>
              <td>
                <strong [style.color]="(s.quantity - s.reservedQuantity) > 0 ? 'var(--accent)' : 'var(--danger)'">
                  {{ s.quantity - s.reservedQuantity }}
                </strong>
              </td>
              <td style="color: var(--text-muted);">$ {{ s.averageCost | number:'1.2-4' }}</td>
              <td><strong style="color: var(--accent);">$ {{ (s.quantity * s.averageCost) | number:'1.2-2' }}</strong></td>
              <td>
                <strong *ngIf="getMargin(s) !== null" [style.color]="getMargin(s)! >= 0 ? 'var(--accent)' : 'var(--danger)'">
                  {{ getMargin(s) | number:'1.1-1' }}%
                </strong>
                <span *ngIf="getMargin(s) === null" style="color: var(--text-dim);">—</span>
              </td>
              <td style="color: var(--text-dim); font-size: 13px;">
                {{ s.updatedAt ? (s.updatedAt | date:'dd/MM/yy HH:mm') : '—' }}
              </td>
              <td>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" (click)="openReserveModal(s)">✏️ Reservado</button>
                  <button class="btn btn-danger btn-sm" [disabled]="s.quantity <= 0" title="Da de baja todo el stock de esta fila como un Ajuste de Salida, visible en el Kardex." (click)="writeOffStock(s)">🗑️ Dar de Baja</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="stock.length === 0">
              <td colspan="12" style="text-align: center; color: var(--text-muted); padding: 40px;">
                <div style="font-size: 32px; margin-bottom: 8px;">📦</div>
                No hay registros de stock.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Stats summary -->
    <div *ngIf="stock.length > 0" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 0;">
      <div class="card-panel" style="margin-bottom: 0; text-align: center;">
        <div style="font-size: 28px; font-weight: 700; color: var(--primary);">{{ totalStock }}</div>
        <div style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Unidades Totales</div>
      </div>
      <div class="card-panel" style="margin-bottom: 0; text-align: center;">
        <div style="font-size: 28px; font-weight: 700; color: var(--warning);">{{ totalReserved }}</div>
        <div style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Reservadas</div>
      </div>
      <div class="card-panel" style="margin-bottom: 0; text-align: center;">
        <div style="font-size: 28px; font-weight: 700; color: var(--accent);">{{ totalAvailable }}</div>
        <div style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Disponibles</div>
      </div>
      <div class="card-panel" style="margin-bottom: 0; text-align: center;">
        <div style="font-size: 28px; font-weight: 700; color: var(--accent);">$ {{ totalValue | number:'1.2-2' }}</div>
        <div style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Valor Total (Costo Prom.)</div>
      </div>
    </div>

    <!-- Modal: Registrar Stock (vía movimiento de kardex) -->
    <div class="modal-backdrop" *ngIf="isMovementModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Registrar Stock</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeMovementModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Tenant</label>
            <select class="form-control" [(ngModel)]="movementForm.tenantId" (change)="onMovementFormTenantChange()">
              <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Almacén</label>
            <select class="form-control" [(ngModel)]="movementForm.warehouseId">
              <option *ngFor="let w of formWarehouses" [ngValue]="w.id">{{ w.name }}</option>
            </select>
            <small *ngIf="formWarehouses.length === 0" style="color: var(--danger);">Este tenant no tiene ningún almacén. Creá uno primero en la sección Almacenes.</small>
          </div>

          <div class="form-group">
            <label class="form-label">Producto</label>
            <select class="form-control" [(ngModel)]="formProductId" (change)="onFormProductChange()">
              <option [ngValue]="undefined" disabled>— Selecciona un Producto —</option>
              <option *ngFor="let p of formProductsList" [ngValue]="p.id">{{ p.name }}</option>
            </select>
          </div>

          <app-variant-picker
            [tenantId]="movementForm.tenantId"
            [productId]="formProductId"
            (variantResolved)="onVariantResolved($event)">
          </app-variant-picker>

          <div class="form-group" style="margin-top: 16px;">
            <label class="form-label">Tipo de Movimiento *</label>
            <select class="form-control" [(ngModel)]="movementForm.movementType">
              <option *ngFor="let o of movementTypeOptions" [ngValue]="o.value">{{ o.label }}</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Cantidad *</label>
              <input type="number" selectOnFocus class="form-control" [(ngModel)]="movementForm.quantity" min="0" step="0.001">
            </div>
            <div class="form-group">
              <label class="form-label">Costo Unitario</label>
              <input type="number" selectOnFocus class="form-control" [(ngModel)]="movementForm.unitCost" min="0" step="0.0001" placeholder="0.00">
            </div>
          </div>
          <p style="color: var(--text-dim); font-size: 12px; margin-top: -10px; margin-bottom: 16px;">
            El costo unitario solo aplica a movimientos de entrada. Este registro queda visible en el Kardex y recalcula el costo promedio ponderado.
          </p>

          <div class="form-group">
            <label class="form-label">Notas / Referencia</label>
            <input type="text" class="form-control" [(ngModel)]="movementForm.notes" placeholder="Ej: Carga inicial, Compra a proveedor X">
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeMovementModal()">Cancelar</button>
          <button class="btn btn-primary" [disabled]="!movementForm.variantId || !movementForm.warehouseId" (click)="saveMovement()">
            Registrar Stock
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Ajustar Cantidad Reservada -->
    <div class="modal-backdrop" *ngIf="isReserveModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Ajustar Cantidad Reservada</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeReserveModal()">✕</button>
        </div>

        <div class="modal-body" *ngIf="editingStock as s">
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 18px;">
            <div><strong>{{ getVariantSku(s.variantId) }}</strong> — {{ getProductName(s.variantId) }}</div>
            <div style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">
              Almacén: {{ s.warehouseName || getWarehouseName(s.warehouseId) }} · Cantidad actual: <strong>{{ s.quantity }}</strong>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Cantidad Reservada</label>
            <input type="number" selectOnFocus class="form-control" [(ngModel)]="reserveQuantity" min="0">
            <small style="color: var(--text-dim);">La reserva es una asignación (ej. pedidos pendientes), no un movimiento físico de stock — por eso no genera un registro en el Kardex. Para cambiar la Cantidad física, usá "➕ Registrar Stock".</small>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeReserveModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveReserved()">Guardar Cambios</button>
        </div>
      </div>
    </div>
  `
})
export class InventoryStockComponent implements OnInit {
  stock: InventoryStock[] = [];
  tenants: Tenant[] = [];
  warehouses: Warehouse[] = [];
  variants: ProductVariant[] = [];
  products: Product[] = [];
  filteredWarehouses: Warehouse[] = [];
  formWarehouses: Warehouse[] = [];
  formProductsList: Product[] = [];
  formProductId: number | undefined = undefined;

  filterTenantId: number | undefined = undefined;
  filterWarehouseId: number | undefined = undefined;
  filterVariantId: number | undefined = undefined;

  isMovementModalOpen = false;
  isReserveModalOpen = false;

  movementTypeOptions = MovementTypeOptions;
  movementForm: RecordMovementDto = {
    tenantId: 0,
    variantId: 0,
    warehouseId: 0,
    movementType: MovementType.InitialStock,
    quantity: 0,
    unitCost: undefined,
    notes: ''
  };

  editingStock: InventoryStock | null = null;
  reserveQuantity = 0;

  constructor(private apiService: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['variantId']) this.filterVariantId = +params['variantId'];
    });
    this.loadAll();
  }

  loadAll(): void {
    this.apiService.getTenants().subscribe({ next: t => this.tenants = t });
    this.apiService.getWarehouses().subscribe({ next: w => {
      this.warehouses = w;
      this.filteredWarehouses = w;
    }});
    this.apiService.getProducts().subscribe({ next: p => this.products = p });
    this.apiService.getProductVariants().subscribe({ next: v => {
      this.variants = v;
      this.loadStock();
    }});
  }

  onTenantFilterChange(): void {
    this.filteredWarehouses = this.filterTenantId
      ? this.warehouses.filter(w => w.tenantId === this.filterTenantId)
      : this.warehouses;
    this.filterWarehouseId = undefined;
    this.loadStock();
  }

  loadStock(): void {
    this.apiService.getInventoryStock(this.filterTenantId, this.filterWarehouseId, this.filterVariantId).subscribe({
      next: data => this.stock = data,
      error: err => console.error('Error al cargar stock:', err)
    });
  }

  get totalStock(): number { return this.stock.reduce((a, s) => a + s.quantity, 0); }
  get totalReserved(): number { return this.stock.reduce((a, s) => a + s.reservedQuantity, 0); }
  get totalAvailable(): number { return this.totalStock - this.totalReserved; }
  get totalValue(): number { return this.stock.reduce((a, s) => a + (s.quantity * (s.averageCost || 0)), 0); }

  getVariantSku(variantId: number): string {
    const v = this.variants.find(x => x.id === variantId);
    return v ? v.sku : `#${variantId}`;
  }

  getProductName(variantId: number): string {
    const v = this.variants.find(x => x.id === variantId);
    if (!v) return '—';
    const p = this.products.find(x => x.id === v.productId);
    return p ? p.name : '—';
  }

  getWarehouseName(warehouseId: number): string {
    const w = this.warehouses.find(x => x.id === warehouseId);
    return w ? w.name : `#${warehouseId}`;
  }

  getTenantName(tenantId: number): string {
    const t = this.tenants.find(x => x.id === tenantId);
    return t ? t.name : `#${tenantId}`;
  }

  tenantTracksCosts(tenantId: number): boolean {
    const t = this.tenants.find(x => x.id === tenantId);
    return t ? t.trackCosts !== false : true;
  }

  getMargin(s: InventoryStock): number | null {
    if (!this.tenantTracksCosts(s.tenantId)) return null;
    const v = this.variants.find(x => x.id === s.variantId);
    if (!v || !v.price) return null;
    return ((v.price - (s.averageCost || 0)) / v.price) * 100;
  }

  onMovementFormTenantChange(): void {
    this.formWarehouses = this.warehouses.filter(w => w.tenantId === this.movementForm.tenantId);
    this.formProductsList = this.products.filter(p => p.tenantId === this.movementForm.tenantId);
    this.movementForm.warehouseId = this.formWarehouses[0]?.id ?? 0;
    this.movementForm.variantId = 0;
    this.formProductId = this.formProductsList[0]?.id;
  }

  onFormProductChange(): void {
    this.movementForm.variantId = 0;
  }

  onVariantResolved(variantId: number | undefined): void {
    this.movementForm.variantId = variantId ?? 0;
    const isInbound = this.movementForm.movementType === MovementType.Purchase || this.movementForm.movementType === MovementType.InitialStock;
    if (isInbound && (this.movementForm.unitCost === undefined || this.movementForm.unitCost === null)) {
      const v = variantId ? this.variants.find(x => x.id === variantId) : undefined;
      if (v && v.referenceCost) this.movementForm.unitCost = v.referenceCost;
    }
  }

  openMovementModal(): void {
    const defaultTenantId = this.filterTenantId ?? this.tenants[0]?.id ?? 0;
    this.formWarehouses = this.warehouses.filter(w => w.tenantId === defaultTenantId);
    this.formProductsList = this.products.filter(p => p.tenantId === defaultTenantId);
    const preselectedVariant = this.filterVariantId ? this.variants.find(v => v.id === this.filterVariantId) : undefined;
    this.formProductId = preselectedVariant?.productId ?? this.formProductsList[0]?.id;
    this.movementForm = {
      tenantId: defaultTenantId,
      variantId: this.filterVariantId ?? 0,
      warehouseId: this.filterWarehouseId ?? this.formWarehouses[0]?.id ?? 0,
      movementType: MovementType.InitialStock,
      quantity: 0,
      unitCost: undefined,
      notes: ''
    };
    this.isMovementModalOpen = true;
  }

  closeMovementModal(): void { this.isMovementModalOpen = false; }

  saveMovement(): void {
    if (!this.movementForm.variantId || !this.movementForm.warehouseId || !this.movementForm.quantity) {
      alert('Completa variante, almacén y cantidad.');
      return;
    }
    this.apiService.recordMovement(this.movementForm).subscribe({
      next: () => { this.closeMovementModal(); this.loadStock(); },
      error: err => alert('Error al registrar stock: ' + (err.error?.message || err.message))
    });
  }

  openReserveModal(s: InventoryStock): void {
    this.editingStock = s;
    this.reserveQuantity = s.reservedQuantity;
    this.isReserveModalOpen = true;
  }

  closeReserveModal(): void {
    this.isReserveModalOpen = false;
    this.editingStock = null;
  }

  saveReserved(): void {
    if (!this.editingStock) return;
    const dto: SaveInventoryStockDto = {
      tenantId: this.editingStock.tenantId,
      warehouseId: this.editingStock.warehouseId,
      variantId: this.editingStock.variantId,
      quantity: this.editingStock.quantity,
      reservedQuantity: this.reserveQuantity
    };
    this.apiService.saveInventoryStock(dto).subscribe({
      next: () => { this.closeReserveModal(); this.loadStock(); },
      error: err => alert('Error al ajustar la cantidad reservada: ' + (err.error?.message || err.message))
    });
  }

  writeOffStock(s: InventoryStock): void {
    if (s.quantity <= 0) return;
    const sku = this.getVariantSku(s.variantId);
    if (!confirm(`¿Dar de baja las ${s.quantity} unidades de "${sku}" en ${s.warehouseName || this.getWarehouseName(s.warehouseId)}?\n\nEsto registra un Ajuste de Salida en el Kardex por el total — el registro de stock queda en 0, no se borra.`)) {
      return;
    }
    const dto: RecordMovementDto = {
      tenantId: s.tenantId,
      variantId: s.variantId,
      warehouseId: s.warehouseId,
      movementType: MovementType.AdjustmentOut,
      quantity: s.quantity,
      notes: 'Baja total de stock'
    };
    this.apiService.recordMovement(dto).subscribe({
      next: () => this.loadStock(),
      error: err => alert('Error al dar de baja el stock: ' + (err.error?.message || err.message))
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectOnFocusDirective } from '../../directives/select-on-focus.directive';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import {
  InventoryMovement, RecordMovementDto, ConvertPresentationDto,
  MovementType, MovementTypeOptions,
  Tenant, Warehouse, ProductVariant, Product
} from '../../models/system.models';
import { VariantPickerComponent } from '../../components/variant-picker/variant-picker.component';

const INBOUND_TYPES = [
  MovementType.Purchase, MovementType.TransferIn, MovementType.AdjustmentIn,
  MovementType.InitialStock, MovementType.PresentationConversionIn
];

@Component({
  selector: 'app-inventory-movements',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectOnFocusDirective, VariantPickerComponent],
  template: `
    <div class="card-panel">
      <div class="card-header-actions">
        <div>
          <h2>📒 Kardex / Movimientos de Inventario</h2>
          <p style="color: var(--text-muted); font-size: 13px;">Historial de movimientos con saldo en cantidad y monto (costo promedio ponderado).</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <select class="form-control" style="width: 180px;" [(ngModel)]="filterTenantId" (change)="onTenantFilterChange()">
            <option [ngValue]="undefined" disabled>— Selecciona Tenant —</option>
            <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
          </select>
          <select class="form-control" style="width: 220px;" [(ngModel)]="filterVariantId" (change)="loadMovements()">
            <option [ngValue]="undefined" disabled>— Selecciona Variante —</option>
            <option *ngFor="let v of filteredVariants" [ngValue]="v.id">{{ v.sku }} — {{ getProductName(v.productId) }}</option>
          </select>
          <select class="form-control" style="width: 180px;" [(ngModel)]="filterWarehouseId" (change)="loadMovements()">
            <option [ngValue]="undefined">— Todos los Almacenes —</option>
            <option *ngFor="let w of filteredWarehouses" [ngValue]="w.id">{{ w.name }}</option>
          </select>
          <button class="btn btn-primary" (click)="openMovementModal()" [disabled]="!filterTenantId">
            ➕ Registrar Movimiento
          </button>
          <button class="btn btn-secondary" (click)="openConvertModal()" [disabled]="!filterTenantId">
            🔄 Convertir Presentación
          </button>
        </div>
      </div>

      <!-- Summary -->
      <div *ngIf="movements.length > 0" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
        <div class="card-panel" style="margin-bottom: 0; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: var(--primary);">{{ lastMovement?.balanceQuantity }}</div>
          <div style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Saldo Actual (Cantidad)</div>
        </div>
        <div class="card-panel" style="margin-bottom: 0; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: var(--warning);">$ {{ lastMovement?.balanceUnitCost | number:'1.2-4' }}</div>
          <div style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Costo Promedio Unitario</div>
        </div>
        <div class="card-panel" style="margin-bottom: 0; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: var(--accent);">$ {{ lastMovement?.balanceAmount | number:'1.2-2' }}</div>
          <div style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Saldo Actual (Monto)</div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Costo Unit.</th>
              <th>Costo Total</th>
              <th>Saldo Cant.</th>
              <th>Saldo Costo Unit.</th>
              <th>Saldo Monto</th>
              <th>Referencia / Notas</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of movements">
              <td style="color: var(--text-dim); font-size: 13px;">{{ m.createdAt | date:'dd/MM/yy HH:mm' }}</td>
              <td>
                <span class="badge" [ngClass]="isInbound(m.movementType) ? 'badge-success' : 'badge-danger'">
                  {{ isInbound(m.movementType) ? '⬆️' : '⬇️' }} {{ m.movementType }}
                </span>
              </td>
              <td><strong>{{ m.quantity }}</strong></td>
              <td>{{ m.unitCost !== undefined && m.unitCost !== null ? ('$ ' + (m.unitCost | number:'1.2-4')) : '—' }}</td>
              <td>{{ m.totalCost !== undefined && m.totalCost !== null ? ('$ ' + (m.totalCost | number:'1.2-2')) : '—' }}</td>
              <td>{{ m.balanceQuantity }}</td>
              <td>$ {{ m.balanceUnitCost | number:'1.2-4' }}</td>
              <td><strong style="color: var(--accent);">$ {{ m.balanceAmount | number:'1.2-2' }}</strong></td>
              <td style="color: var(--text-muted); font-size: 13px;">{{ m.notes || m.referenceType || '—' }}</td>
            </tr>
            <tr *ngIf="movements.length === 0">
              <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 40px;">
                <div style="font-size: 32px; margin-bottom: 8px;">📒</div>
                {{ filterVariantId ? 'No hay movimientos registrados para esta variante.' : 'Selecciona un tenant y una variante para ver el kardex.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Registrar Movimiento -->
    <div class="modal-backdrop" *ngIf="isMovementModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Registrar Movimiento de Inventario</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeMovementModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Producto</label>
            <select class="form-control" [(ngModel)]="movementFormProductId" (change)="onMovementFormProductChange()">
              <option [ngValue]="undefined" disabled>— Selecciona un Producto —</option>
              <option *ngFor="let p of movementFormProducts" [ngValue]="p.id">{{ p.name }}</option>
            </select>
          </div>

          <app-variant-picker
            [tenantId]="movementForm.tenantId"
            [productId]="movementFormProductId"
            [initialVariantId]="movementForm.variantId || undefined"
            (variantResolved)="onMovementVariantResolved($event)">
          </app-variant-picker>

          <div class="form-group" style="margin-top: 16px;">
            <label class="form-label">Almacén</label>
            <select class="form-control" [(ngModel)]="movementForm.warehouseId">
              <option *ngFor="let w of filteredWarehouses" [ngValue]="w.id">{{ w.name }}</option>
            </select>
            <small *ngIf="filteredWarehouses.length === 0" style="color: var(--danger);">Este tenant no tiene ningún almacén. Creá uno primero en la sección Almacenes.</small>
          </div>

          <div class="form-group">
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
            El costo unitario solo aplica a movimientos de entrada. En salidas se usa automáticamente el costo promedio ponderado vigente.
          </p>

          <div class="form-group">
            <label class="form-label">Notas / Referencia</label>
            <input type="text" class="form-control" [(ngModel)]="movementForm.notes" placeholder="Ej: Compra a proveedor X, Orden #1234">
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeMovementModal()">Cancelar</button>
          <button class="btn btn-primary" [disabled]="!movementForm.variantId || !movementForm.warehouseId" (click)="saveMovement()">Registrar Movimiento</button>
        </div>
      </div>
    </div>

    <!-- Modal: Convertir Presentación -->
    <div class="modal-backdrop" *ngIf="isConvertModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Convertir Presentación</h3>
          <button style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;" (click)="closeConvertModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Almacén</label>
            <select class="form-control" [(ngModel)]="convertForm.warehouseId">
              <option *ngFor="let w of filteredWarehouses" [ngValue]="w.id">{{ w.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Variante Origen *</label>
            <select class="form-control" [(ngModel)]="convertForm.fromVariantId">
              <option *ngFor="let v of filteredVariants" [ngValue]="v.id">{{ v.sku }} — {{ getProductName(v.productId) }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Variante Destino *</label>
            <select class="form-control" [(ngModel)]="convertForm.toVariantId">
              <option *ngFor="let v of filteredVariants" [ngValue]="v.id">{{ v.sku }} — {{ getProductName(v.productId) }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Cantidad a Convertir (en Variante Origen) *</label>
            <input type="number" selectOnFocus class="form-control" [(ngModel)]="convertForm.quantityFrom" min="0" step="0.001">
          </div>

          <p style="color: var(--text-dim); font-size: 12px;">
            Requiere que una de las dos variantes tenga configurada la otra como "Variante Base" con su Factor de Conversión (ver Variantes de Producto).
          </p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeConvertModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveConvert()">Convertir</button>
        </div>
      </div>
    </div>
  `
})
export class InventoryMovementsComponent implements OnInit {
  tenants: Tenant[] = [];
  warehouses: Warehouse[] = [];
  variants: ProductVariant[] = [];
  products: Product[] = [];
  filteredWarehouses: Warehouse[] = [];
  filteredVariants: ProductVariant[] = [];

  movementTypeOptions = MovementTypeOptions;

  filterTenantId: number | undefined = undefined;
  filterVariantId: number | undefined = undefined;
  filterWarehouseId: number | undefined = undefined;

  movements: InventoryMovement[] = [];

  isMovementModalOpen = false;
  isConvertModalOpen = false;

  movementFormProducts: Product[] = [];
  movementFormProductId: number | undefined = undefined;

  movementForm: RecordMovementDto = {
    tenantId: 0, variantId: 0, warehouseId: 0,
    movementType: MovementType.Purchase, quantity: 0, unitCost: undefined, notes: ''
  };

  convertForm: ConvertPresentationDto = {
    tenantId: 0, warehouseId: 0, fromVariantId: 0, toVariantId: 0, quantityFrom: 0
  };

  constructor(private apiService: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['variantId']) this.filterVariantId = +params['variantId'];
    });

    this.apiService.getTenants().subscribe({
      next: t => {
        this.tenants = t;
        this.apiService.getWarehouses().subscribe({ next: w => this.warehouses = w });
        this.apiService.getProducts().subscribe({ next: p => this.products = p });
        this.apiService.getProductVariants().subscribe({
          next: v => {
            this.variants = v;
            if (this.filterVariantId) {
              const found = this.variants.find(x => x.id === this.filterVariantId);
              this.filterTenantId = found?.tenantId ?? this.tenants[0]?.id;
            } else {
              this.filterTenantId = this.tenants[0]?.id;
            }
            this.onTenantFilterChange();
          }
        });
      },
      error: err => console.error('Error al cargar tenants:', err)
    });
  }

  get lastMovement(): InventoryMovement | undefined {
    return this.movements.length > 0 ? this.movements[this.movements.length - 1] : undefined;
  }

  isInbound(type: MovementType): boolean {
    return INBOUND_TYPES.includes(type);
  }

  getProductName(productId: number): string {
    const p = this.products.find(x => x.id === productId);
    return p ? p.name : `Producto #${productId}`;
  }

  onTenantFilterChange(): void {
    this.filteredWarehouses = this.warehouses.filter(w => w.tenantId === this.filterTenantId);
    this.filteredVariants = this.variants.filter(v => v.tenantId === this.filterTenantId);
    if (!this.filteredVariants.find(v => v.id === this.filterVariantId)) {
      this.filterVariantId = this.filteredVariants[0]?.id;
    }
    this.filterWarehouseId = undefined;
    this.loadMovements();
  }

  loadMovements(): void {
    this.movements = [];
    if (!this.filterTenantId || !this.filterVariantId) return;
    this.apiService.getMovements(this.filterTenantId, this.filterVariantId, this.filterWarehouseId).subscribe({
      next: data => this.movements = data,
      error: err => console.error('Error al cargar kardex:', err)
    });
  }

  openMovementModal(): void {
    if (!this.filterTenantId) return;
    this.movementFormProducts = this.products.filter(p => p.tenantId === this.filterTenantId);
    const preselectedVariant = this.filterVariantId ? this.variants.find(v => v.id === this.filterVariantId) : undefined;
    this.movementFormProductId = preselectedVariant?.productId ?? this.movementFormProducts[0]?.id;
    this.movementForm = {
      tenantId: this.filterTenantId,
      variantId: this.filterVariantId ?? 0,
      warehouseId: this.filterWarehouseId ?? this.filteredWarehouses[0]?.id ?? 0,
      movementType: MovementType.Purchase,
      quantity: 0,
      unitCost: undefined,
      notes: ''
    };
    this.isMovementModalOpen = true;
  }

  onMovementFormProductChange(): void {
    this.movementForm.variantId = 0;
  }

  onMovementVariantResolved(variantId: number | undefined): void {
    this.movementForm.variantId = variantId ?? 0;
    const isInbound = this.movementForm.movementType === MovementType.Purchase || this.movementForm.movementType === MovementType.InitialStock;
    if (isInbound && (this.movementForm.unitCost === undefined || this.movementForm.unitCost === null)) {
      const v = variantId ? this.variants.find(x => x.id === variantId) : undefined;
      if (v && v.referenceCost) this.movementForm.unitCost = v.referenceCost;
    }
  }

  closeMovementModal(): void { this.isMovementModalOpen = false; }

  saveMovement(): void {
    if (!this.movementForm.variantId || !this.movementForm.warehouseId || !this.movementForm.quantity) {
      alert('Completa variante, almacén y cantidad.');
      return;
    }
    this.apiService.recordMovement(this.movementForm).subscribe({
      next: () => {
        this.closeMovementModal();
        if (this.movementForm.variantId === this.filterVariantId) this.loadMovements();
      },
      error: err => alert('Error al registrar movimiento: ' + (err.error?.message || err.message))
    });
  }

  openConvertModal(): void {
    if (!this.filterTenantId) return;
    this.convertForm = {
      tenantId: this.filterTenantId,
      warehouseId: this.filterWarehouseId ?? this.filteredWarehouses[0]?.id ?? 0,
      fromVariantId: this.filterVariantId ?? this.filteredVariants[0]?.id ?? 0,
      toVariantId: this.filteredVariants[1]?.id ?? this.filteredVariants[0]?.id ?? 0,
      quantityFrom: 0
    };
    this.isConvertModalOpen = true;
  }

  closeConvertModal(): void { this.isConvertModalOpen = false; }

  saveConvert(): void {
    if (!this.convertForm.warehouseId || !this.convertForm.fromVariantId || !this.convertForm.toVariantId || !this.convertForm.quantityFrom) {
      alert('Completa almacén, variante origen, variante destino y cantidad.');
      return;
    }
    if (this.convertForm.fromVariantId === this.convertForm.toVariantId) {
      alert('La variante origen y destino deben ser distintas.');
      return;
    }
    this.apiService.convertPresentation(this.convertForm).subscribe({
      next: () => {
        this.closeConvertModal();
        if (this.convertForm.fromVariantId === this.filterVariantId || this.convertForm.toVariantId === this.filterVariantId) {
          this.loadMovements();
        }
      },
      error: err => alert('Error al convertir presentación: ' + (err.error?.message || err.message))
    });
  }
}

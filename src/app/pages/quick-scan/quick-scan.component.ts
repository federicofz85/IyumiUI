import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectOnFocusDirective } from '../../directives/select-on-focus.directive';
import { ApiService } from '../../services/api.service';
import {
  Tenant, Warehouse, Category,
  QuickScanLookupResult, QuickScanCreateDto,
  MovementType, MovementTypeOptions, RecordMovementDto
} from '../../models/system.models';

interface RecentScanRow {
  time: string;
  barcode: string;
  product: string;
  quantity: number;
  kind: 'new' | 'restock';
}

@Component({
  selector: 'app-quick-scan',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectOnFocusDirective],
  template: `
    <div class="card-panel">
      <div class="card-header-actions">
        <div>
          <h2>📷 Escaneo Rápido</h2>
          <p style="color: var(--text-muted); font-size: 13px;">Pasá el lector de código de barras: si ya lo conocemos, sumamos stock; si es nuevo, lo prellenamos desde el catálogo global cuando sea posible.</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <select class="form-control" style="width: 200px;" [(ngModel)]="tenantId" (change)="onTenantChange()">
            <option [ngValue]="undefined" disabled>— Selecciona Tenant —</option>
            <option *ngFor="let t of tenants" [ngValue]="t.id">{{ t.name }}</option>
          </select>
          <select class="form-control" style="width: 200px;" [(ngModel)]="warehouseId" (change)="focusBarcode()">
            <option [ngValue]="undefined" disabled>— Selecciona Almacén —</option>
            <option *ngFor="let w of filteredWarehouses" [ngValue]="w.id">{{ w.name }}</option>
          </select>
        </div>
      </div>

      <div *ngIf="!tenantId || !warehouseId" style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 20px; color: var(--warning);">
        ⚠️ Seleccioná un Tenant y un Almacén para empezar a escanear.
      </div>

      <div class="form-group">
        <label class="form-label">Código de Barras</label>
        <input #barcodeInput type="text" class="form-control"
               style="font-size: 24px; padding: 16px; text-align: center; letter-spacing: 1px;"
               [(ngModel)]="barcode"
               [disabled]="!tenantId || !warehouseId || status === 'loading'"
               (keyup.enter)="onScan()"
               placeholder="Escaneá o tipeá un código...">
      </div>

      <div *ngIf="toastMessage" style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.35); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 20px; color: var(--accent); font-weight: 600;">
        ✅ {{ toastMessage }}
      </div>

      <div *ngIf="status === 'idle'" style="text-align: center; color: var(--text-muted); padding: 30px;">
        <div style="font-size: 32px; margin-bottom: 8px;">📷</div>
        Escaneá un producto para empezar.
      </div>

      <div *ngIf="status === 'loading'" style="text-align: center; color: var(--text-muted); padding: 30px;">
        Buscando...
      </div>

      <!-- Caso A: variante existente -->
      <div *ngIf="status === 'existing' && lookupResult" style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px;">
        <div style="display:flex; align-items:center; gap: 10px; margin-bottom: 14px;">
          <span class="badge badge-info">📦 Ya lo tenés cargado</span>
          <strong>{{ lookupResult.productName }}</strong>
          <code style="background: rgba(255,255,255,0.07); padding: 3px 8px; border-radius: 6px; font-size: 12px;">{{ lookupResult.variant?.sku }}</code>
        </div>
        <div *ngIf="currentStockForWarehouse() as cs" style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
          Stock actual en este almacén: <strong style="color: var(--text-main);">{{ cs.quantity }}</strong> unidades
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Tipo de Movimiento</label>
            <select class="form-control" [(ngModel)]="stockForm.movementType">
              <option *ngFor="let o of movementTypeOptions" [ngValue]="o.value">{{ o.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Cantidad *</label>
            <input type="number" selectOnFocus class="form-control" [(ngModel)]="stockForm.quantity" min="0" step="0.001">
          </div>
        </div>

        <div class="form-group" *ngIf="tenantTracksCosts()">
          <label class="form-label">Costo Unitario</label>
          <input type="number" selectOnFocus class="form-control" [(ngModel)]="stockForm.unitCost" min="0" step="0.0001">
        </div>

        <div class="form-group">
          <label class="form-label">Notas</label>
          <input type="text" class="form-control" [(ngModel)]="stockForm.notes" placeholder="Opcional">
        </div>

        <div style="display:flex; gap: 10px; margin-top: 8px;">
          <button class="btn btn-primary" (click)="saveRestock()">✅ Agregar Stock</button>
          <button class="btn btn-secondary" (click)="cancelScan()">✕ Cancelar</button>
        </div>
      </div>

      <!-- Caso B: producto nuevo -->
      <div *ngIf="status === 'new' && lookupResult" style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px;">
        <div style="margin-bottom: 14px;">
          <span class="badge" [ngClass]="lookupResult.catalogMatch ? 'badge-success' : 'badge-info'">
            {{ lookupResult.catalogMatch ? '✅ Encontrado en catálogo' : '🆕 Producto no encontrado, cargalo vos' }}
          </span>
        </div>

        <div *ngIf="lookupResult.catalogProduct as cp" style="display:flex; gap: 14px; align-items:center; margin-bottom: 18px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: var(--radius-md);">
          <div *ngIf="cp.imageUrl" style="width:48px; height:48px; border-radius:8px; overflow:hidden; flex-shrink:0; border: 1px solid var(--border-color);">
            <img [src]="cp.imageUrl" style="width:100%; height:100%; object-fit:cover;" alt="producto">
          </div>
          <div style="font-size: 13px; color: var(--text-muted);">
            <div *ngIf="cp.brand">Marca: <strong style="color: var(--text-main);">{{ cp.brand }}</strong></div>
            <div *ngIf="cp.unitOfMeasure">Presentación: {{ cp.unitOfMeasure }}</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Nombre *</label>
          <input #nameInput type="text" class="form-control" [(ngModel)]="newForm.name" placeholder="Nombre del producto">
        </div>

        <div class="form-group">
          <label class="form-label">Categoría</label>
          <select class="form-control" [(ngModel)]="newForm.categoryId">
            <option [ngValue]="undefined">— Sin categoría —</option>
            <option *ngFor="let c of categories" [ngValue]="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Precio de Venta *</label>
            <input type="number" selectOnFocus class="form-control" [(ngModel)]="newForm.price" min="0" step="0.01">
          </div>
          <div class="form-group" *ngIf="tenantTracksCosts()">
            <label class="form-label">Costo</label>
            <input type="number" selectOnFocus class="form-control" [(ngModel)]="newForm.referenceCost" min="0" step="0.0001">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Cantidad Inicial</label>
          <input type="number" selectOnFocus class="form-control" [(ngModel)]="newForm.quantity" min="0" step="0.001">
        </div>

        <div class="form-group">
          <label class="form-label">Notas</label>
          <input type="text" class="form-control" [(ngModel)]="newForm.notes" placeholder="Opcional">
        </div>

        <label class="form-check" *ngIf="!lookupResult.catalogMatch">
          <input type="checkbox" [(ngModel)]="newForm.suggestToCatalog">
          <span>Sugerir este producto al catálogo global (queda pendiente de revisión, no se publica solo)</span>
        </label>

        <div style="display:flex; gap: 10px; margin-top: 8px;">
          <button class="btn btn-primary" (click)="saveNewProduct()">✅ Crear y Cargar Stock</button>
          <button class="btn btn-secondary" (click)="cancelScan()">✕ Cancelar</button>
        </div>
      </div>
    </div>

    <div class="card-panel" *ngIf="recentScans.length > 0">
      <h3 style="margin-bottom: 14px; font-size: 15px;">Escaneos Recientes</h3>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Código</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of recentScans">
              <td style="color: var(--text-dim); font-size: 13px;">{{ r.time }}</td>
              <td><code style="background: rgba(255,255,255,0.07); padding: 3px 8px; border-radius: 6px; font-size: 12px;">{{ r.barcode }}</code></td>
              <td>{{ r.product }}</td>
              <td><strong>{{ r.quantity }}</strong></td>
              <td>
                <span class="badge" [ngClass]="r.kind === 'new' ? 'badge-info' : 'badge-success'">
                  {{ r.kind === 'new' ? '🆕 Nuevo' : '📦 Reposición' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class QuickScanComponent implements OnInit {
  @ViewChild('barcodeInput') barcodeInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('nameInput') nameInputRef?: ElementRef<HTMLInputElement>;

  tenants: Tenant[] = [];
  warehouses: Warehouse[] = [];
  filteredWarehouses: Warehouse[] = [];
  categories: Category[] = [];

  tenantId: number | undefined = undefined;
  warehouseId: number | undefined = undefined;

  barcode = '';
  status: 'idle' | 'loading' | 'existing' | 'new' = 'idle';
  lookupResult: QuickScanLookupResult | undefined;

  movementTypeOptions = MovementTypeOptions;

  stockForm = {
    movementType: MovementType.Purchase as MovementType,
    quantity: 0,
    unitCost: undefined as number | undefined,
    notes: ''
  };

  newForm = {
    name: '',
    categoryId: undefined as number | undefined,
    price: 0,
    referenceCost: 0,
    quantity: 0,
    notes: '',
    suggestToCatalog: false
  };

  recentScans: RecentScanRow[] = [];
  toastMessage: string | null = null;
  private toastTimer: any;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getTenants().subscribe({
      next: t => {
        this.tenants = t;
        this.apiService.getWarehouses().subscribe({ next: w => this.warehouses = w });
      }
    });
  }

  onTenantChange(): void {
    this.filteredWarehouses = this.warehouses.filter(w => w.tenantId === this.tenantId);
    this.warehouseId = this.filteredWarehouses[0]?.id;
    if (this.tenantId) {
      this.apiService.getCategories(this.tenantId).subscribe({ next: c => this.categories = c });
    }
    this.focusBarcode();
  }

  tenantTracksCosts(): boolean {
    const t = this.tenants.find(x => x.id === this.tenantId);
    return t ? t.trackCosts !== false : true;
  }

  focusBarcode(): void {
    setTimeout(() => this.barcodeInputRef?.nativeElement.focus(), 0);
  }

  currentStockForWarehouse() {
    return this.lookupResult?.variant?.stocks?.find(s => s.warehouseId === this.warehouseId);
  }

  onScan(): void {
    if (!this.tenantId || !this.warehouseId || !this.barcode.trim()) return;
    const code = this.barcode.trim();
    this.status = 'loading';

    this.apiService.quickScanLookup(this.tenantId, code).subscribe({
      next: result => {
        this.lookupResult = result;
        if (result.existingVariant) {
          this.status = 'existing';
          this.stockForm = {
            movementType: MovementType.Purchase,
            quantity: 0,
            unitCost: this.tenantTracksCosts() ? (result.variant?.referenceCost ?? undefined) : undefined,
            notes: ''
          };
        } else {
          this.status = 'new';
          this.newForm = {
            name: result.catalogProduct?.name ?? '',
            categoryId: undefined,
            price: 0,
            referenceCost: 0,
            quantity: 0,
            notes: '',
            suggestToCatalog: false
          };
          if (!result.catalogMatch) {
            setTimeout(() => this.nameInputRef?.nativeElement.focus(), 0);
          }
        }
      },
      error: err => {
        this.status = 'idle';
        alert('Error al buscar el código: ' + (err.error?.message || err.message));
      }
    });
  }

  cancelScan(): void {
    this.status = 'idle';
    this.lookupResult = undefined;
    this.barcode = '';
    this.focusBarcode();
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = null, 3000);
  }

  private pushRecent(barcode: string, product: string, quantity: number, kind: 'new' | 'restock'): void {
    this.recentScans.unshift({
      time: new Date().toLocaleTimeString(),
      barcode, product, quantity, kind
    });
  }

  private resetAfterSave(): void {
    this.status = 'idle';
    this.lookupResult = undefined;
    this.barcode = '';
    this.focusBarcode();
  }

  saveRestock(): void {
    if (!this.tenantId || !this.warehouseId || !this.lookupResult?.variant) return;
    if (!this.stockForm.quantity) {
      alert('Ingresá una cantidad.');
      return;
    }
    const dto: RecordMovementDto = {
      tenantId: this.tenantId,
      variantId: this.lookupResult.variant.id,
      warehouseId: this.warehouseId,
      movementType: this.stockForm.movementType,
      quantity: this.stockForm.quantity,
      unitCost: this.stockForm.unitCost,
      notes: this.stockForm.notes || undefined
    };
    this.apiService.recordMovement(dto).subscribe({
      next: () => {
        this.showToast('Stock agregado correctamente.');
        this.pushRecent(this.barcode, this.lookupResult?.productName || '', this.stockForm.quantity, 'restock');
        this.resetAfterSave();
      },
      error: err => alert('Error al agregar stock: ' + (err.error?.message || err.message))
    });
  }

  saveNewProduct(): void {
    if (!this.tenantId || !this.warehouseId) return;
    if (!this.newForm.name.trim()) {
      alert('Ingresá el nombre del producto.');
      return;
    }
    const dto: QuickScanCreateDto = {
      tenantId: this.tenantId,
      barcode: this.barcode,
      name: this.newForm.name.trim(),
      categoryId: this.newForm.categoryId,
      price: this.newForm.price,
      referenceCost: this.newForm.referenceCost,
      warehouseId: this.warehouseId,
      quantity: this.newForm.quantity,
      notes: this.newForm.notes || undefined
    };
    this.apiService.quickScanCreate(dto).subscribe({
      next: result => {
        this.showToast('Producto creado y stock cargado.');
        this.pushRecent(this.barcode, this.newForm.name, this.newForm.quantity, 'new');

        if (this.newForm.suggestToCatalog && !this.lookupResult?.catalogMatch) {
          this.apiService.createCatalogSuggestion({
            barcode: this.barcode,
            name: this.newForm.name.trim(),
            submittedByTenantId: this.tenantId!,
            submittedByVariantId: result.variantId
          }).subscribe({
            error: err => console.error('Error al enviar sugerencia al catálogo:', err)
          });
        }

        this.resetAfterSave();
      },
      error: err => alert('Error al crear el producto: ' + (err.error?.message || err.message))
    });
  }
}

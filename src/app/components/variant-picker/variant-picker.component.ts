import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { VariantMatrix, VariantMatrixAttribute } from '../../models/system.models';

@Component({
  selector: 'app-variant-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="matrix">
      <!-- Producto sin atributos configurados: select plano de variantes -->
      <div class="form-group" *ngIf="matrix.attributes.length === 0">
        <label class="form-label">Variante</label>
        <select class="form-control" [(ngModel)]="simpleVariantId" (ngModelChange)="onSimpleChange()">
          <option [ngValue]="undefined" disabled>— Selecciona una variante —</option>
          <option *ngFor="let v of matrix.variants" [ngValue]="v.variantId">{{ v.sku }} — $ {{ v.price | number:'1.2-2' }}</option>
        </select>
        <small *ngIf="matrix.variants.length === 0" style="color: var(--text-dim);">Este producto no tiene variantes cargadas.</small>
      </div>

      <!-- Producto con atributos: picker por atributo -->
      <div *ngIf="matrix.attributes.length > 0">
        <div class="form-group" *ngFor="let attr of matrix.attributes">
          <label class="form-label">{{ attr.name }}</label>

          <!-- Color: swatches -->
          <div *ngIf="attr.displayType === 'Color'" style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button type="button" *ngFor="let opt of attr.options"
                    (click)="selectOption(attr, opt.id)"
                    [title]="opt.value"
                    style="display:flex; flex-direction:column; align-items:center; gap:4px; background:none; border:none; cursor:pointer; padding:4px;">
              <span [style.background]="opt.hexColor || '#333'"
                    [style.box-shadow]="selections[attr.attributeId] === opt.id ? '0 0 0 3px var(--primary)' : '0 0 0 1px rgba(255,255,255,0.25)'"
                    style="width:28px; height:28px; border-radius:50%; display:inline-block;"></span>
              <small style="color: var(--text-muted); font-size:11px;">{{ opt.value }}</small>
            </button>
          </div>

          <!-- Lista de opciones: select -->
          <select *ngIf="attr.displayType === 'OptionsList'" class="form-control"
                  [ngModel]="selections[attr.attributeId]"
                  (ngModelChange)="setSelection(attr.attributeId, $event)">
            <option [ngValue]="undefined">— Selecciona {{ attr.name }} —</option>
            <option *ngFor="let opt of attr.options" [ngValue]="opt.id">{{ opt.value }}</option>
          </select>

          <!-- Texto libre -->
          <input *ngIf="attr.displayType === 'FreeText'" type="text" class="form-control"
                 [ngModel]="selections[attr.attributeId]"
                 (ngModelChange)="setSelection(attr.attributeId, $event)"
                 [placeholder]="'Valor de ' + attr.name">
        </div>

        <!-- Preview -->
        <div *ngIf="resolvedVariant" style="display:flex; align-items:center; gap:12px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: var(--radius-md); padding: 10px 14px; margin-top: 4px;">
          <div *ngIf="resolvedVariant.imageUrl" style="width:36px; height:36px; border-radius:8px; overflow:hidden; flex-shrink:0;">
            <img [src]="resolvedVariant.imageUrl" style="width:100%; height:100%; object-fit:cover;" alt="variante">
          </div>
          <div>
            <strong style="color: var(--accent);">{{ resolvedVariant.sku }}</strong>
            <span style="color: var(--text-muted); margin-left: 8px;">$ {{ resolvedVariant.price | number:'1.2-2' }}</span>
          </div>
        </div>
        <div *ngIf="!resolvedVariant" style="color: var(--text-dim); font-size: 13px; margin-top: 4px;">
          {{ allSelected() ? 'No existe una variante con esa combinación de atributos.' : 'Selecciona todos los atributos para identificar la variante.' }}
        </div>
      </div>
    </div>
    <div *ngIf="!matrix && productId" style="color: var(--text-dim); font-size: 13px;">Cargando variantes del producto...</div>
    <div *ngIf="!productId" style="color: var(--text-dim); font-size: 13px;">Selecciona un producto primero.</div>
  `
})
export class VariantPickerComponent implements OnChanges {
  @Input() tenantId: number | undefined;
  @Input() productId: number | undefined;
  @Input() initialVariantId: number | undefined;
  @Output() variantResolved = new EventEmitter<number | undefined>();

  matrix: VariantMatrix | undefined;
  selections: { [attributeId: number]: number | string | undefined } = {};
  simpleVariantId: number | undefined;
  resolvedVariant: VariantMatrix['variants'][number] | undefined;

  constructor(private apiService: ApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['productId'] || changes['tenantId']) && this.productId && this.tenantId) {
      this.loadMatrix();
    } else if (!this.productId) {
      this.matrix = undefined;
      this.resolvedVariant = undefined;
      this.selections = {};
      this.simpleVariantId = undefined;
    }
  }

  loadMatrix(): void {
    if (!this.productId || !this.tenantId) return;
    this.matrix = undefined;
    this.selections = {};
    this.simpleVariantId = undefined;
    this.resolvedVariant = undefined;

    this.apiService.getVariantMatrix(this.productId, this.tenantId).subscribe({
      next: data => {
        this.matrix = data;
        this.prefillFromInitial();
      },
      error: err => console.error('Error al cargar la matriz de variantes:', err)
    });
  }

  private prefillFromInitial(): void {
    if (!this.matrix || !this.initialVariantId) return;
    const found = this.matrix.variants.find(v => v.variantId === this.initialVariantId);
    if (!found) return;

    if (this.matrix.attributes.length === 0) {
      this.simpleVariantId = found.variantId;
      this.emitResolved(found);
      return;
    }

    this.matrix.attributes.forEach(attr => {
      if (found.optionSelections[attr.attributeId] != null) {
        this.selections[attr.attributeId] = found.optionSelections[attr.attributeId] as number;
      } else if (found.freeTextValues[attr.attributeId] != null) {
        this.selections[attr.attributeId] = found.freeTextValues[attr.attributeId];
      }
    });
    this.resolveVariant();
  }

  onSimpleChange(): void {
    const found = this.matrix?.variants.find(v => v.variantId === this.simpleVariantId);
    this.emitResolved(found);
  }

  selectOption(attr: VariantMatrixAttribute, optionId: number): void {
    this.setSelection(attr.attributeId, optionId);
  }

  setSelection(attributeId: number, value: number | string | undefined): void {
    this.selections[attributeId] = value;
    this.resolveVariant();
  }

  allSelected(): boolean {
    if (!this.matrix) return false;
    return this.matrix.attributes.every(a => {
      const v = this.selections[a.attributeId];
      return v !== undefined && v !== null && v !== '';
    });
  }

  resolveVariant(): void {
    if (!this.matrix) {
      this.emitResolved(undefined);
      return;
    }
    if (!this.allSelected()) {
      this.emitResolved(undefined);
      return;
    }

    const match = this.matrix.variants.find(v =>
      this.matrix!.attributes.every(a => {
        const selected = this.selections[a.attributeId];
        if (a.displayType === 'FreeText') {
          return (v.freeTextValues[a.attributeId] ?? '') === selected;
        }
        return v.optionSelections[a.attributeId] === selected;
      })
    );
    this.emitResolved(match);
  }

  private emitResolved(variant: VariantMatrix['variants'][number] | undefined): void {
    this.resolvedVariant = variant;
    this.variantResolved.emit(variant?.variantId);
  }
}

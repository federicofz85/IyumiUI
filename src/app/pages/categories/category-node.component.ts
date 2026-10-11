import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryTreeNode } from '../../models/system.models';

@Component({
  selector: 'app-category-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tree-node">
      <div class="tree-row">
        <span class="badge" [ngClass]="node.active ? 'badge-success' : 'badge-danger'" style="min-width: 60px; text-align: center;">
          {{ node.active ? 'Activa' : 'Inactiva' }}
        </span>
        <strong>{{ node.name }}</strong>
        <div style="display: flex; gap: 6px; margin-left: auto;">
          <button class="btn btn-secondary btn-sm" (click)="addChild.emit(node)">➕ Subcategoría</button>
          <button class="btn btn-secondary btn-sm" (click)="edit.emit(node)">✏️</button>
          <button class="btn btn-danger btn-sm" (click)="delete.emit(node)">🗑️</button>
        </div>
      </div>
      <div class="tree-children" *ngIf="node.children.length > 0">
        <app-category-node
          *ngFor="let child of node.children"
          [node]="child"
          (edit)="edit.emit($event)"
          (delete)="delete.emit($event)"
          (addChild)="addChild.emit($event)">
        </app-category-node>
      </div>
    </div>
  `,
  styles: [`
    .tree-node { margin-bottom: 4px; }
    .tree-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }
    .tree-children {
      margin-left: 28px;
      margin-top: 6px;
      padding-left: 12px;
      border-left: 1px dashed var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
  `]
})
export class CategoryNodeComponent {
  @Input() node!: CategoryTreeNode;
  @Output() edit = new EventEmitter<CategoryTreeNode>();
  @Output() delete = new EventEmitter<CategoryTreeNode>();
  @Output() addChild = new EventEmitter<CategoryTreeNode>();
}

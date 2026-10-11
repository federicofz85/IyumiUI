import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div>
      <div style="margin-bottom: 24px;">
        <h2>Resumen del Sistema</h2>
        <p style="color: var(--text-muted);">Métricas generales y accesos rápidos a la gestión de inventario.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px;">
        <div class="card-panel" style="padding: 20px; display: flex; align-items: center; gap: 16px;">
          <div style="width: 50px; height: 50px; background: rgba(99, 102, 241, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #818cf8;">🏢</div>
          <div>
            <div style="font-size: 28px; font-weight: 800;">{{ tenantCount }}</div>
            <div style="font-size: 13px; color: var(--text-muted);">Tenants Registrados</div>
          </div>
        </div>

        <div class="card-panel" style="padding: 20px; display: flex; align-items: center; gap: 16px;">
          <div style="width: 50px; height: 50px; background: rgba(16, 185, 129, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #34d399;">📍</div>
          <div>
            <div style="font-size: 28px; font-weight: 800;">{{ branchCount }}</div>
            <div style="font-size: 13px; color: var(--text-muted);">Sucursales Activas</div>
          </div>
        </div>

        <div class="card-panel" style="padding: 20px; display: flex; align-items: center; gap: 16px;">
          <div style="width: 50px; height: 50px; background: rgba(245, 158, 11, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #fbbf24;">🏬</div>
          <div>
            <div style="font-size: 28px; font-weight: 800;">{{ warehouseCount }}</div>
            <div style="font-size: 13px; color: var(--text-muted);">Almacenes Configurados</div>
          </div>
        </div>

        <div class="card-panel" style="padding: 20px; display: flex; align-items: center; gap: 16px;">
          <div style="width: 50px; height: 50px; background: rgba(59, 130, 246, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #60a5fa;">📦</div>
          <div>
            <div style="font-size: 28px; font-weight: 800;">{{ productCount }}</div>
            <div style="font-size: 13px; color: var(--text-muted);">Productos en Catálogo</div>
          </div>
        </div>
      </div>

      <div class="card-panel">
        <h3 style="margin-bottom: 16px;">Módulos del Sistema</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <a routerLink="/admin/tenants" class="nav-item" style="padding: 16px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2);">
            <span style="font-size: 24px;">🏢</span>
            <div>
              <div style="font-weight: 700; color: #fff;">Gestión de Tenants</div>
              <div style="font-size: 12px; color: var(--text-muted);">Configura moneda, sucursales y opciones de inventario por empresa.</div>
            </div>
          </a>

          <a routerLink="/admin/branches" class="nav-item" style="padding: 16px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2);">
            <span style="font-size: 24px;">📍</span>
            <div>
              <div style="font-weight: 700; color: #fff;">Sucursales y Geolocalización</div>
              <div style="font-size: 12px; color: var(--text-muted);">Administra direcciones, coordenadas y búsqueda por proximidad.</div>
            </div>
          </a>

          <a routerLink="/admin/products" class="nav-item" style="padding: 16px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2);">
            <span style="font-size: 24px;">📦</span>
            <div>
              <div style="font-weight: 700; color: #fff;">Catálogo de Productos</div>
              <div style="font-size: 12px; color: var(--text-muted);">Define productos pesables, imágenes y variantes asociadas.</div>
            </div>
          </a>

          <a routerLink="/admin/inventory-stock" class="nav-item" style="padding: 16px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2);">
            <span style="font-size: 24px;">📈</span>
            <div>
              <div style="font-weight: 700; color: #fff;">Control de Inventario y Stock</div>
              <div style="font-size: 12px; color: var(--text-muted);">Gestiona existencias por depósito y variante de producto.</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  tenantCount = 0;
  branchCount = 0;
  warehouseCount = 0;
  productCount = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getTenants().subscribe({
      next: data => this.tenantCount = data.length,
      error: () => this.tenantCount = 0
    });
    this.apiService.getBranches().subscribe({
      next: data => this.branchCount = data.length,
      error: () => this.branchCount = 0
    });
    this.apiService.getWarehouses().subscribe({
      next: data => this.warehouseCount = data.length,
      error: () => this.warehouseCount = 0
    });
    this.apiService.getProducts().subscribe({
      next: data => this.productCount = data.length,
      error: () => this.productCount = 0
    });
  }
}

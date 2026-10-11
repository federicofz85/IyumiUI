import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { PosLayoutComponent } from './layout/pos-layout/pos-layout.component';
import { authGuard } from './guards/auth.guard';
import { homeGuard } from './guards/home.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [homeGuard],
    loadComponent: () =>
      import('./pages/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup/signup-wizard.component').then(m => m.SignupWizardComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./pages/tenants/tenants.component').then(m => m.TenantsComponent)
      },
      {
        path: 'branches',
        loadComponent: () =>
          import('./pages/branches/branches.component').then(m => m.BranchesComponent)
      },
      {
        path: 'warehouses',
        loadComponent: () =>
          import('./pages/warehouses/warehouses.component').then(m => m.WarehousesComponent)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'product-variants',
        loadComponent: () =>
          import('./pages/product-variants/product-variants.component').then(m => m.ProductVariantsComponent)
      },
      {
        path: 'inventory-stock',
        loadComponent: () =>
          import('./pages/inventory-stock/inventory-stock.component').then(m => m.InventoryStockComponent)
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories/categories.component').then(m => m.CategoriesComponent)
      },
      {
        path: 'locations',
        loadComponent: () =>
          import('./pages/locations/locations.component').then(m => m.LocationsComponent)
      },
      {
        path: 'product-attributes',
        loadComponent: () =>
          import('./pages/product-attributes/product-attributes.component').then(m => m.ProductAttributesComponent)
      },
      {
        path: 'inventory-movements',
        loadComponent: () =>
          import('./pages/inventory-movements/inventory-movements.component').then(m => m.InventoryMovementsComponent)
      },
      {
        path: 'scan',
        loadComponent: () =>
          import('./pages/quick-scan/quick-scan.component').then(m => m.QuickScanComponent)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/roles/roles.component').then(m => m.RolesComponent)
      }
    ]
  },
  {
    path: 'pos',
    component: PosLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'scan',
        pathMatch: 'full'
      },
      {
        path: 'scan',
        loadComponent: () =>
          import('./pages/quick-scan/quick-scan.component').then(m => m.QuickScanComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

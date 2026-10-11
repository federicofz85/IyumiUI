import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Tenant, CreateTenantDto,
  Branch, CreateBranchDto,
  Warehouse, CreateWarehouseDto,
  Product, CreateProductDto,
  ProductVariant, CreateProductVariantDto,
  InventoryStock, SaveInventoryStockDto,
  Category, CreateCategoryDto, UpdateCategoryDto, CategoryTreeNode,
  Location, CreateLocationDto, UpdateLocationDto, LocationTreeNode,
  ProductAttribute, CreateProductAttributeDto, UpdateProductAttributeDto,
  ProductAttributeOption, CreateProductAttributeOptionDto, UpdateProductAttributeOptionDto,
  VariantAttributeValue, SetVariantAttributeDto, VariantMatrix,
  InventoryMovement, RecordMovementDto, ConvertPresentationDto,
  QuickScanLookupResult, QuickScanCreateDto, QuickScanResult, CreateGlobalCatalogSuggestionDto,
  Permission, Role, CreateRoleDto, UpdateRoleDto, CloneRoleDto,
  AppUser, CreateUserDto, UpdateUserDto, SetPasswordDto,
  RegisterTenantDto, LoginResult
} from '../models/system.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://localhost:7198/api';

  constructor(private http: HttpClient) {}

  // TENANTS
  getTenants(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(`${this.baseUrl}/tenants`);
  }

  getTenantById(id: number): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.baseUrl}/tenants/${id}`);
  }

  createTenant(dto: CreateTenantDto): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.baseUrl}/tenants`, dto);
  }

  updateTenant(id: number, dto: CreateTenantDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/tenants/${id}`, dto);
  }

  deleteTenant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tenants/${id}`);
  }

  // BRANCHES
  getBranches(tenantId?: number): Observable<Branch[]> {
    let params = new HttpParams();
    if (tenantId) params = params.set('tenantId', tenantId.toString());
    return this.http.get<Branch[]>(`${this.baseUrl}/branches`, { params });
  }

  getNearbyBranches(lat: number, lng: number, maxDistanceKm: number = 50, tenantId?: number): Observable<Branch[]> {
    let params = new HttpParams()
      .set('latitude', lat.toString())
      .set('longitude', lng.toString())
      .set('maxDistanceKm', maxDistanceKm.toString());
    if (tenantId) params = params.set('tenantId', tenantId.toString());
    return this.http.get<Branch[]>(`${this.baseUrl}/branches/nearby`, { params });
  }

  createBranch(dto: CreateBranchDto): Observable<Branch> {
    return this.http.post<Branch>(`${this.baseUrl}/branches`, dto);
  }

  updateBranch(id: number, dto: Partial<CreateBranchDto>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/branches/${id}`, dto);
  }

  deleteBranch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/branches/${id}`);
  }

  // WAREHOUSES
  getWarehouses(tenantId?: number): Observable<Warehouse[]> {
    let params = new HttpParams();
    if (tenantId) params = params.set('tenantId', tenantId.toString());
    return this.http.get<Warehouse[]>(`${this.baseUrl}/warehouses`, { params });
  }

  createWarehouse(dto: CreateWarehouseDto): Observable<Warehouse> {
    return this.http.post<Warehouse>(`${this.baseUrl}/warehouses`, dto);
  }

  updateWarehouse(id: number, dto: Partial<CreateWarehouseDto>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/warehouses/${id}`, dto);
  }

  deleteWarehouse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/warehouses/${id}`);
  }

  // PRODUCTS
  getProducts(tenantId?: number): Observable<Product[]> {
    let params = new HttpParams();
    if (tenantId) params = params.set('tenantId', tenantId.toString());
    return this.http.get<Product[]>(`${this.baseUrl}/products`, { params });
  }

  getProductById(id: number, tenantId?: number): Observable<Product> {
    let params = new HttpParams();
    if (tenantId) params = params.set('tenantId', tenantId.toString());
    return this.http.get<Product>(`${this.baseUrl}/products/${id}`, { params });
  }

  createProduct(dto: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products`, dto);
  }

  updateProduct(id: number, dto: Partial<CreateProductDto>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/products/${id}`, dto);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
  }

  // PRODUCT VARIANTS
  getProductVariants(tenantId?: number, productId?: number): Observable<ProductVariant[]> {
    let params = new HttpParams();
    if (tenantId) params = params.set('tenantId', tenantId.toString());
    if (productId) params = params.set('productId', productId.toString());
    return this.http.get<ProductVariant[]>(`${this.baseUrl}/productvariants`, { params });
  }

  createProductVariant(dto: CreateProductVariantDto): Observable<ProductVariant> {
    return this.http.post<ProductVariant>(`${this.baseUrl}/productvariants`, dto);
  }

  updateProductVariant(id: number, dto: Partial<CreateProductVariantDto>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/productvariants/${id}`, dto);
  }

  deleteProductVariant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/productvariants/${id}`);
  }

  // INVENTORY STOCK
  getInventoryStock(tenantId?: number, warehouseId?: number, variantId?: number): Observable<InventoryStock[]> {
    let params = new HttpParams();
    if (tenantId) params = params.set('tenantId', tenantId.toString());
    if (warehouseId) params = params.set('warehouseId', warehouseId.toString());
    if (variantId) params = params.set('variantId', variantId.toString());
    return this.http.get<InventoryStock[]>(`${this.baseUrl}/inventorystock`, { params });
  }

  saveInventoryStock(dto: SaveInventoryStockDto): Observable<InventoryStock> {
    return this.http.post<InventoryStock>(`${this.baseUrl}/inventorystock`, dto);
  }

  // CATEGORIES
  getCategories(tenantId?: number): Observable<Category[]> {
    let params = new HttpParams();
    if (tenantId) params = params.set('tenantId', tenantId.toString());
    return this.http.get<Category[]>(`${this.baseUrl}/categories`, { params });
  }

  getCategoryTree(tenantId: number): Observable<CategoryTreeNode[]> {
    const params = new HttpParams().set('tenantId', tenantId.toString());
    return this.http.get<CategoryTreeNode[]>(`${this.baseUrl}/categories/tree`, { params });
  }

  createCategory(dto: CreateCategoryDto): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, dto);
  }

  updateCategory(id: number, dto: UpdateCategoryDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/categories/${id}`, dto);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }

  // LOCATIONS
  getLocations(tenantId?: number, warehouseId?: number): Observable<Location[]> {
    let params = new HttpParams();
    if (tenantId) params = params.set('tenantId', tenantId.toString());
    if (warehouseId) params = params.set('warehouseId', warehouseId.toString());
    return this.http.get<Location[]>(`${this.baseUrl}/locations`, { params });
  }

  getLocationTree(tenantId: number, warehouseId: number): Observable<LocationTreeNode[]> {
    const params = new HttpParams()
      .set('tenantId', tenantId.toString())
      .set('warehouseId', warehouseId.toString());
    return this.http.get<LocationTreeNode[]>(`${this.baseUrl}/locations/tree`, { params });
  }

  createLocation(dto: CreateLocationDto): Observable<Location> {
    return this.http.post<Location>(`${this.baseUrl}/locations`, dto);
  }

  updateLocation(id: number, dto: UpdateLocationDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/locations/${id}`, dto);
  }

  deleteLocation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/locations/${id}`);
  }

  // PRODUCT ATTRIBUTES (EAV)
  getProductAttributes(tenantId?: number): Observable<ProductAttribute[]> {
    let params = new HttpParams();
    if (tenantId) params = params.set('tenantId', tenantId.toString());
    return this.http.get<ProductAttribute[]>(`${this.baseUrl}/productattributes`, { params });
  }

  createProductAttribute(dto: CreateProductAttributeDto): Observable<ProductAttribute> {
    return this.http.post<ProductAttribute>(`${this.baseUrl}/productattributes`, dto);
  }

  updateProductAttribute(id: number, dto: UpdateProductAttributeDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/productattributes/${id}`, dto);
  }

  deleteProductAttribute(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/productattributes/${id}`);
  }

  // VARIANT ATTRIBUTE VALUES (EAV)
  getVariantAttributes(variantId: number, tenantId: number): Observable<VariantAttributeValue[]> {
    const params = new HttpParams().set('tenantId', tenantId.toString());
    return this.http.get<VariantAttributeValue[]>(`${this.baseUrl}/productvariants/${variantId}/attributes`, { params });
  }

  setVariantAttributes(variantId: number, tenantId: number, values: SetVariantAttributeDto[]): Observable<void> {
    const params = new HttpParams().set('tenantId', tenantId.toString());
    return this.http.put<void>(`${this.baseUrl}/productvariants/${variantId}/attributes`, values, { params });
  }

  // PRODUCT ATTRIBUTE OPTIONS (catálogo por atributo)
  getAttributeOptions(attributeId: number, tenantId: number): Observable<ProductAttributeOption[]> {
    const params = new HttpParams().set('tenantId', tenantId.toString());
    return this.http.get<ProductAttributeOption[]>(`${this.baseUrl}/productattributes/${attributeId}/options`, { params });
  }

  createAttributeOption(attributeId: number, dto: CreateProductAttributeOptionDto): Observable<ProductAttributeOption> {
    return this.http.post<ProductAttributeOption>(`${this.baseUrl}/productattributes/${attributeId}/options`, dto);
  }

  updateAttributeOption(attributeId: number, optionId: number, dto: UpdateProductAttributeOptionDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/productattributes/${attributeId}/options/${optionId}`, dto);
  }

  deleteAttributeOption(attributeId: number, optionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/productattributes/${attributeId}/options/${optionId}`);
  }

  // VARIANT MATRIX (picker inteligente por atributos)
  getVariantMatrix(productId: number, tenantId: number): Observable<VariantMatrix> {
    const params = new HttpParams().set('tenantId', tenantId.toString());
    return this.http.get<VariantMatrix>(`${this.baseUrl}/products/${productId}/variant-matrix`, { params });
  }

  // INVENTORY MOVEMENTS (KARDEX)
  getMovements(tenantId: number, variantId: number, warehouseId?: number, from?: string, to?: string): Observable<InventoryMovement[]> {
    let params = new HttpParams()
      .set('tenantId', tenantId.toString())
      .set('variantId', variantId.toString());
    if (warehouseId) params = params.set('warehouseId', warehouseId.toString());
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<InventoryMovement[]>(`${this.baseUrl}/inventorymovements`, { params });
  }

  recordMovement(dto: RecordMovementDto): Observable<InventoryMovement> {
    return this.http.post<InventoryMovement>(`${this.baseUrl}/inventorymovements`, dto);
  }

  convertPresentation(dto: ConvertPresentationDto): Observable<{ outMovement: InventoryMovement; inMovement: InventoryMovement }> {
    return this.http.post<{ outMovement: InventoryMovement; inMovement: InventoryMovement }>(`${this.baseUrl}/inventorymovements/convert-presentation`, dto);
  }

  // QUICK SCAN
  quickScanLookup(tenantId: number, barcode: string): Observable<QuickScanLookupResult> {
    const params = new HttpParams()
      .set('tenantId', tenantId.toString())
      .set('barcode', barcode);
    return this.http.get<QuickScanLookupResult>(`${this.baseUrl}/quickscan/lookup`, { params });
  }

  quickScanCreate(dto: QuickScanCreateDto): Observable<QuickScanResult> {
    return this.http.post<QuickScanResult>(`${this.baseUrl}/quickscan`, dto);
  }

  // CATALOG SUGGESTIONS
  createCatalogSuggestion(dto: CreateGlobalCatalogSuggestionDto): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/catalogsuggestions`, dto);
  }

  // PERMISSIONS
  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.baseUrl}/permissions`);
  }

  // ROLES
  getRoles(tenantId?: number): Observable<Role[]> {
    let params = new HttpParams();
    if (tenantId) params = params.set('tenantId', tenantId.toString());
    return this.http.get<Role[]>(`${this.baseUrl}/roles`, { params });
  }

  createRole(dto: CreateRoleDto): Observable<Role> {
    return this.http.post<Role>(`${this.baseUrl}/roles`, dto);
  }

  updateRole(id: number, dto: UpdateRoleDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/roles/${id}`, dto);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roles/${id}`);
  }

  cloneRole(id: number, dto: CloneRoleDto): Observable<Role> {
    return this.http.post<Role>(`${this.baseUrl}/roles/${id}/clone`, dto);
  }

  // USERS
  getUsers(tenantId?: number): Observable<AppUser[]> {
    let params = new HttpParams();
    if (tenantId) params = params.set('tenantId', tenantId.toString());
    return this.http.get<AppUser[]>(`${this.baseUrl}/users`, { params });
  }

  createUser(dto: CreateUserDto): Observable<AppUser> {
    return this.http.post<AppUser>(`${this.baseUrl}/users`, dto);
  }

  updateUser(id: number, dto: UpdateUserDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/users/${id}`, dto);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }

  setUserPassword(id: number, dto: SetPasswordDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/users/${id}/password`, dto);
  }

  // ONBOARDING (wizard público de alta de tienda)
  registerTenant(dto: RegisterTenantDto): Observable<LoginResult> {
    return this.http.post<LoginResult>(`${this.baseUrl}/onboarding/register`, dto);
  }
}

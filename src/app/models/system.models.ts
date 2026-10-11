export enum CurrencyCode {
  USD = 'USD',
  ARS = 'ARS',
  EUR = 'EUR',
  BRL = 'BRL',
  CLP = 'CLP',
  MXN = 'MXN',
  UYU = 'UYU',
  COP = 'COP',
  PEN = 'PEN'
}

export const CurrencyCodeOptions = [
  { value: 'USD', label: 'USD ($ - Dólar US)' },
  { value: 'ARS', label: 'ARS ($ - Peso Argentino)' },
  { value: 'EUR', label: 'EUR (€ - Euro)' },
  { value: 'BRL', label: 'BRL (R$ - Real Brasileño)' },
  { value: 'CLP', label: 'CLP ($ - Peso Chileno)' },
  { value: 'MXN', label: 'MXN ($ - Peso Mexicano)' },
  { value: 'UYU', label: 'UYU ($U - Peso Uruguayo)' },
  { value: 'COP', label: 'COP ($ - Peso Colombiano)' },
  { value: 'PEN', label: 'PEN (S/ - Sol Peruano)' }
];

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  currency: CurrencyCode;
  currencyName?: string;
  allowMultiWarehouse: boolean;
  allowMultiBranch: boolean;
  trackInventory: boolean;
  trackCosts: boolean;
  createdAt?: string;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  currency: CurrencyCode;
  allowMultiWarehouse: boolean;
  allowMultiBranch: boolean;
  trackInventory: boolean;
  trackCosts: boolean;
}

export interface Branch {
  id: number;
  tenantId: number;
  name: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  distanceKm?: number;
}

export interface CreateBranchDto {
  tenantId: number;
  name: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  active: boolean;
}

export interface Warehouse {
  id: number;
  tenantId: number;
  name: string;
  active: boolean;
  createdAt?: string;
}

export interface CreateWarehouseDto {
  tenantId: number;
  name: string;
  active: boolean;
}

export interface Product {
  id: number;
  tenantId: number;
  categoryId?: number;
  categoryName?: string;
  name: string;
  description?: string;
  isWeighable: boolean;
  imageUrl?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  variants?: ProductVariant[];
}

export interface CreateProductDto {
  tenantId: number;
  categoryId?: number;
  name: string;
  description?: string;
  isWeighable: boolean;
  imageUrl?: string;
  active: boolean;
}

export interface ProductVariant {
  id: number;
  tenantId: number;
  productId: number;
  sku: string;
  barcode?: string;
  color?: string;
  size?: string;
  baseVariantId?: number;
  conversionFactor?: number;
  price: number;
  referenceCost: number;
  imageUrl?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  stocks?: InventoryStock[];
}

export interface CreateProductVariantDto {
  tenantId: number;
  productId: number;
  sku: string;
  barcode?: string;
  color?: string;
  size?: string;
  baseVariantId?: number;
  conversionFactor?: number;
  price: number;
  referenceCost: number;
  imageUrl?: string;
  active: boolean;
}

export interface InventoryStock {
  tenantId: number;
  warehouseId: number;
  warehouseName?: string;
  variantId: number;
  quantity: number;
  reservedQuantity: number;
  averageCost: number;
  updatedAt?: string;
}

export interface SaveInventoryStockDto {
  tenantId: number;
  warehouseId: number;
  variantId: number;
  quantity: number;
  reservedQuantity: number;
}

export interface Category {
  id: number;
  tenantId: number;
  parentCategoryId?: number;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryDto {
  tenantId: number;
  parentCategoryId?: number;
  name: string;
  active: boolean;
}

export interface UpdateCategoryDto {
  parentCategoryId?: number;
  name: string;
  active: boolean;
}

export interface CategoryTreeNode {
  id: number;
  name: string;
  active: boolean;
  children: CategoryTreeNode[];
}

export interface Location {
  id: number;
  tenantId: number;
  warehouseId: number;
  parentLocationId?: number;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLocationDto {
  tenantId: number;
  warehouseId: number;
  parentLocationId?: number;
  name: string;
  active: boolean;
}

export interface UpdateLocationDto {
  parentLocationId?: number;
  name: string;
  active: boolean;
}

export interface LocationTreeNode {
  id: number;
  name: string;
  active: boolean;
  children: LocationTreeNode[];
}

export enum AttributeDisplayType {
  FreeText = 'FreeText',
  OptionsList = 'OptionsList',
  Color = 'Color'
}

export const AttributeDisplayTypeOptions = [
  { value: 'FreeText', label: 'Texto Libre' },
  { value: 'OptionsList', label: 'Lista de Opciones' },
  { value: 'Color', label: 'Lista de Colores (con hex)' }
];

export interface ProductAttribute {
  id: number;
  tenantId: number;
  name: string;
  displayType: AttributeDisplayType;
  active: boolean;
  createdAt?: string;
}

export interface CreateProductAttributeDto {
  tenantId: number;
  name: string;
  displayType: AttributeDisplayType;
  active: boolean;
}

export interface UpdateProductAttributeDto {
  name: string;
  displayType: AttributeDisplayType;
  active: boolean;
}

export interface ProductAttributeOption {
  id: number;
  tenantId: number;
  attributeId: number;
  value: string;
  hexColor?: string;
  sortOrder: number;
  active: boolean;
}

export interface CreateProductAttributeOptionDto {
  tenantId: number;
  attributeId: number;
  value: string;
  hexColor?: string;
  sortOrder: number;
  active: boolean;
}

export interface UpdateProductAttributeOptionDto {
  value: string;
  hexColor?: string;
  sortOrder: number;
  active: boolean;
}

export interface VariantAttributeValue {
  attributeId: number;
  attributeName: string;
  optionId?: number;
  hexColor?: string;
  value: string;
}

export interface SetVariantAttributeDto {
  attributeId: number;
  optionId?: number;
  value?: string;
}

export interface VariantMatrixAttribute {
  attributeId: number;
  name: string;
  displayType: AttributeDisplayType;
  options: ProductAttributeOption[];
}

export interface VariantMatrixVariant {
  variantId: number;
  sku: string;
  imageUrl?: string;
  price: number;
  active: boolean;
  optionSelections: { [attributeId: number]: number | null };
  freeTextValues: { [attributeId: number]: string };
}

export interface VariantMatrix {
  attributes: VariantMatrixAttribute[];
  variants: VariantMatrixVariant[];
}

export enum MovementType {
  Purchase = 'Purchase',
  Sale = 'Sale',
  TransferOut = 'TransferOut',
  TransferIn = 'TransferIn',
  AdjustmentIn = 'AdjustmentIn',
  AdjustmentOut = 'AdjustmentOut',
  PresentationConversionOut = 'PresentationConversionOut',
  PresentationConversionIn = 'PresentationConversionIn',
  InitialStock = 'InitialStock'
}

export const MovementTypeOptions = [
  { value: 'Purchase', label: 'Compra (Entrada)' },
  { value: 'Sale', label: 'Venta (Salida)' },
  { value: 'TransferIn', label: 'Transferencia - Entrada' },
  { value: 'TransferOut', label: 'Transferencia - Salida' },
  { value: 'AdjustmentIn', label: 'Ajuste - Entrada' },
  { value: 'AdjustmentOut', label: 'Ajuste - Salida' },
  { value: 'InitialStock', label: 'Stock Inicial' }
];

export interface InventoryMovement {
  id: number;
  tenantId: number;
  variantId: number;
  warehouseId: number;
  locationId?: number;
  movementType: MovementType;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  balanceQuantity: number;
  balanceUnitCost: number;
  balanceAmount: number;
  referenceType?: string;
  referenceId?: number;
  notes?: string;
  createdAt: string;
}

export interface RecordMovementDto {
  tenantId: number;
  variantId: number;
  warehouseId: number;
  locationId?: number;
  movementType: MovementType;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: number;
  notes?: string;
}

export interface ConvertPresentationDto {
  tenantId: number;
  warehouseId: number;
  locationId?: number;
  fromVariantId: number;
  toVariantId: number;
  quantityFrom: number;
}

// GLOBAL CATALOG / QUICK SCAN
export interface GlobalCatalogProduct {
  id: number;
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  suggestedCategory?: string;
  unitOfMeasure?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuickScanLookupResult {
  existingVariant: boolean;
  variant?: ProductVariant;
  productId?: number;
  productName?: string;
  catalogMatch: boolean;
  catalogProduct?: GlobalCatalogProduct;
}

export interface QuickScanCreateDto {
  tenantId: number;
  barcode: string;
  name: string;
  categoryId?: number;
  price: number;
  referenceCost: number;
  warehouseId: number;
  quantity: number;
  notes?: string;
}

export interface QuickScanResult {
  productId: number;
  variantId: number;
  movement: InventoryMovement;
}

export interface CreateGlobalCatalogSuggestionDto {
  barcode: string;
  name?: string;
  brand?: string;
  imageUrl?: string;
  suggestedCategory?: string;
  submittedByTenantId: number;
  submittedByVariantId?: number;
}

// AUTH / USUARIOS-ROLES-PERMISOS
export interface AuthUser {
  id: number;
  tenantId: number | null;
  email: string;
  displayName: string;
  isSuperAdmin: boolean;
  landingRoute: string;
  permissions: string[];
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

// ONBOARDING (wizard público "Crear mi tienda" desde la landing)
export interface RegisterTenantDto {
  storeName: string;
  address?: string;
  phone?: string;
  currency: CurrencyCode;
  allowMultiBranch: boolean;
  allowMultiWarehouse: boolean;
  sellsByWeight: boolean;
  hasColorOrSizeVariants: boolean;
  trackCosts: boolean;
  ownerDisplayName: string;
  ownerEmail: string;
  ownerPassword: string;
}

// GESTIÓN DE USUARIOS Y ROLES (Fase 5)
export interface Permission {
  key: string;
  module: string;
  description?: string;
}

export interface RoleSummary {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  tenantId?: number;
  name: string;
  isSystemTemplate: boolean;
  defaultLandingRoute?: string;
  createdAt?: string;
  permissionKeys: string[];
}

export interface CreateRoleDto {
  tenantId?: number;
  name: string;
  defaultLandingRoute?: string;
  permissionKeys: string[];
}

export interface UpdateRoleDto {
  name: string;
  defaultLandingRoute?: string;
  permissionKeys: string[];
}

export interface CloneRoleDto {
  tenantId: number;
  name: string;
}

export interface AppUser {
  id: number;
  tenantId?: number;
  email: string;
  displayName: string;
  active: boolean;
  isSuperAdmin: boolean;
  createdAt?: string;
  roles: RoleSummary[];
}

export interface CreateUserDto {
  tenantId?: number;
  email: string;
  password: string;
  displayName: string;
  active: boolean;
  isSuperAdmin: boolean;
  roleIds: number[];
}

export interface UpdateUserDto {
  displayName: string;
  active: boolean;
  isSuperAdmin: boolean;
  roleIds: number[];
}

export interface SetPasswordDto {
  newPassword: string;
}

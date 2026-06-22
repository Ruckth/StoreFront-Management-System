import type { Product, ProductFormValues, User } from "../types";

const LOCAL_PRODUCTS_KEY = "storefront.localProducts";
const LOCAL_ID_PREFIX = "local-";

export function isLocalProductId(id: string | number | undefined) {
  return typeof id === "string" && id.startsWith(LOCAL_ID_PREFIX);
}

export function listLocalProducts() {
  const rawValue = localStorage.getItem(LOCAL_PRODUCTS_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Product[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    localStorage.removeItem(LOCAL_PRODUCTS_KEY);
    return [];
  }
}

export function getLocalProduct(id: string | number) {
  return listLocalProducts().find((product) => product.id === id) ?? null;
}

export async function createLocalProduct(values: ProductFormValues, seller: User) {
  const now = new Date().toISOString();
  const image = values.image ? await fileToDataUrl(values.image) : "";
  const product: Product = {
    id: `${LOCAL_ID_PREFIX}${crypto.randomUUID()}`,
    seller: {
      id: seller.id,
      email: seller.email,
    },
    image,
    title: values.title.trim(),
    description: values.description.trim(),
    unit_price: normalizeMoney(values.unit_price),
    available_quantity: Number(values.available_quantity),
    created_at: now,
    updated_at: now,
  };

  saveLocalProducts([...listLocalProducts(), product]);
  return product;
}

export function deleteLocalProduct(id: string | number) {
  saveLocalProducts(listLocalProducts().filter((product) => product.id !== id));
}

export function mergeProducts(backendProducts: Product[], localProducts = listLocalProducts()) {
  const backendIds = new Set(backendProducts.map((product) => String(product.id)));
  const uniqueLocalProducts = localProducts.filter(
    (product) => !backendIds.has(String(product.id)),
  );
  return [...backendProducts, ...uniqueLocalProducts];
}

function saveLocalProducts(products: Product[]) {
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
}

function normalizeMoney(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "0.00";
  }

  return amount.toFixed(2);
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

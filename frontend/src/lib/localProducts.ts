import type { Product } from "../types";

const LOCAL_PRODUCTS_KEY = "storefront.localProducts";
const LOCAL_ID_PREFIX = "local-";
const LOCAL_DEMO_ID_PREFIX = "local-demo-";

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
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    const products = parsedValue.filter(
      (product) => !String(product.id).startsWith(LOCAL_DEMO_ID_PREFIX),
    );
    if (products.length !== parsedValue.length) {
      saveLocalProducts(products);
    }

    return products;
  } catch {
    localStorage.removeItem(LOCAL_PRODUCTS_KEY);
    return [];
  }
}

export function getLocalProduct(id: string | number) {
  return listLocalProducts().find((product) => product.id === id) ?? null;
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

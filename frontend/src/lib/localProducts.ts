import type { Product, ProductFormValues, User } from "../types";

const LOCAL_PRODUCTS_KEY = "storefront.localProducts";
const LOCAL_ID_PREFIX = "local-";
const DEMO_SELLER = {
  id: 0,
  email: "demo@storefront.local",
};

const DEMO_PRODUCT_DEFINITIONS = [
  {
    id: "local-demo-unbreakable-shorts",
    title: "The Unbreakable",
    description: "Lightweight performance shorts with a breathable training fit.",
    unit_price: "78.00",
    available_quantity: 12,
    accent: "#202020",
    label: "SHORTS",
  },
  {
    id: "local-demo-reliable-pants",
    title: "The Reliable",
    description: "Everyday warmup pants with a relaxed athletic cut.",
    unit_price: "138.00",
    available_quantity: 8,
    accent: "#111111",
    label: "PANTS",
  },
  {
    id: "local-demo-symbol-sock-white",
    title: "The Symbol Sock White",
    description: "Three-pack ribbed crew socks for training days.",
    unit_price: "38.00",
    available_quantity: 18,
    accent: "#f5f5f5",
    label: "SOCKS",
  },
  {
    id: "local-demo-water-bottle",
    title: "Water Bottle",
    description: "Matte stainless bottle for everyday hydration.",
    unit_price: "38.00",
    available_quantity: 16,
    accent: "#d83224",
    label: "BOTTLE",
  },
  {
    id: "local-demo-strong-tee",
    title: "The Strong",
    description: "Training tee with a clean heavyweight feel.",
    unit_price: "68.00",
    available_quantity: 6,
    accent: "#2d2d2d",
    label: "TEE",
  },
  {
    id: "local-demo-mighty-hoodie",
    title: "The Mighty",
    description: "Soft fleece hoodie with a relaxed streetwear fit.",
    unit_price: "118.00",
    available_quantity: 0,
    accent: "#050505",
    label: "HOODIE",
  },
];

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

export function seedDemoProducts() {
  const existingProducts = listLocalProducts();
  if (existingProducts.length > 0) {
    return existingProducts;
  }

  const now = new Date().toISOString();
  const demoProducts: Product[] = DEMO_PRODUCT_DEFINITIONS.map((product) => ({
    id: product.id,
    seller: DEMO_SELLER,
    image: demoProductImage(product.title, product.accent, product.label),
    title: product.title,
    description: product.description,
    unit_price: product.unit_price,
    available_quantity: product.available_quantity,
    created_at: now,
    updated_at: now,
  }));

  saveLocalProducts(demoProducts);
  return demoProducts;
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

function demoProductImage(title: string, accent: string, label: string) {
  const textColor = accent === "#f5f5f5" ? "#111111" : "#ffffff";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1062">
      <rect width="900" height="1062" fill="#eeeeee"/>
      <rect x="130" y="120" width="640" height="760" rx="44" fill="${accent}"/>
      <circle cx="450" cy="270" r="92" fill="rgba(255,255,255,0.16)"/>
      <path d="M258 719c104-96 235-144 386-145" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="28" stroke-linecap="round"/>
      <path d="M296 777c91-71 198-107 322-108" fill="none" stroke="rgba(0,0,0,0.14)" stroke-width="18" stroke-linecap="round"/>
      <text x="450" y="506" text-anchor="middle" fill="${textColor}" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="900" letter-spacing="0">${label}</text>
      <text x="450" y="596" text-anchor="middle" fill="${textColor}" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" letter-spacing="0">${escapeSvgText(title)}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

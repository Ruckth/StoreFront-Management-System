import type {
  ApiErrorPayload,
  LoginResponse,
  Product,
  ProductFormValues,
  Role,
  User,
} from "../types";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "");

type RequestOptions = RequestInit & {
  token?: string | null;
};

export class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload | null;

  constructor(status: number, payload: ApiErrorPayload | null) {
    super(formatApiError(payload, status));
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function formatApiError(payload: ApiErrorPayload | null, status: number) {
  if (!payload) {
    return `Request failed with status ${status}.`;
  }

  if (payload.detail) {
    return payload.detail;
  }

  const firstField = Object.entries(payload)[0];
  if (!firstField) {
    return `Request failed with status ${status}.`;
  }

  const [field, value] = firstField;
  const message = Array.isArray(value) ? value[0] : value;
  return `${field}: ${message}`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as T | ApiErrorPayload)
    : null;

  if (!response.ok) {
    throw new ApiError(response.status, payload as ApiErrorPayload | null);
  }

  return payload as T;
}

export function login(email: string, password: string) {
  return request<LoginResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(email: string, password: string, role: Role) {
  return request<User>("/auth/register/", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });
}

export function getCurrentUser(token: string) {
  return request<User>("/auth/me/", { token });
}

export function listProducts(params?: { search?: string; inStock?: boolean }) {
  const searchParams = new URLSearchParams();
  if (params?.search) {
    searchParams.set("search", params.search);
  }
  if (params?.inStock) {
    searchParams.set("in_stock", "true");
  }

  const query = searchParams.toString();
  return request<Product[]>(`/products/${query ? `?${query}` : ""}`);
}

export function getProduct(id: string | number) {
  return request<Product>(`/products/${id}/`);
}

export function createProduct(values: ProductFormValues, token: string) {
  return request<Product>("/products/", {
    method: "POST",
    body: productFormData(values, true),
    token,
  });
}

export function updateProduct(
  id: string | number,
  values: ProductFormValues,
  token: string,
) {
  return request<Product>(`/products/${id}/`, {
    method: "PATCH",
    body: productFormData(values, false),
    token,
  });
}

export function deleteProduct(id: string | number, token: string) {
  return request<void>(`/products/${id}/`, {
    method: "DELETE",
    token,
  });
}

function productFormData(values: ProductFormValues, requireImage: boolean) {
  const formData = new FormData();
  formData.set("title", values.title.trim());
  formData.set("description", values.description.trim());
  formData.set("unit_price", values.unit_price);
  formData.set("available_quantity", values.available_quantity);

  if (values.image) {
    formData.set("image", values.image);
  } else if (requireImage) {
    formData.set("image", "");
  }

  return formData;
}

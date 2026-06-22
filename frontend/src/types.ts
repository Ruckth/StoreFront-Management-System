export type Role = "buyer" | "seller";

export type User = {
  id: number;
  email: string;
  role: Role;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type LoginResponse = AuthTokens & {
  user: User;
};

export type ProductSeller = {
  id: number;
  email: string;
};

export type Product = {
  id: number;
  seller: ProductSeller;
  image: string;
  title: string;
  description: string;
  unit_price: string;
  available_quantity: number;
  created_at: string;
  updated_at: string;
};

export type ProductFormValues = {
  title: string;
  description: string;
  unit_price: string;
  available_quantity: string;
  image: File | null;
};

export type ApiErrorPayload = {
  detail?: string;
  [field: string]: string[] | string | undefined;
};

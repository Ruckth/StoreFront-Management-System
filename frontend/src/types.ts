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
  id: number | string;
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

export type CartProduct = Pick<
  Product,
  "id" | "title" | "image" | "unit_price" | "available_quantity"
>;

export type CartItem = {
  id: number;
  product: CartProduct;
  quantity: number;
  line_total: string;
};

export type Cart = {
  id: number;
  status: "active" | "checked_out";
  items: CartItem[];
  total_price: string;
  created_at: string;
  updated_at: string;
};

export type OrderSummary = {
  id: number;
  total_price: string;
  item_count: number;
  created_at: string;
};

export type OrderItem = {
  id: number;
  product_id: number;
  product_title_snapshot: string;
  unit_price_snapshot: string;
  quantity: number;
  line_total: string;
};

export type OrderDetail = {
  id: number;
  total_price: string;
  items: OrderItem[];
  created_at: string;
};

export type ApiErrorPayload = {
  detail?: string;
  [field: string]: string[] | string | undefined;
};

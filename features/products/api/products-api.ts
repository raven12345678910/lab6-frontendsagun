import { ApiError, request } from "@/lib/api-client";

export interface Product {
  id: number;
  product_name: string;
  description: string | null;
  price: string | number;
  quantity: number;
  created_at: string;
}

export type ProductFields = {
  product_name: string;
  description: string;
  price: string;
  quantity: string;
};

export async function getProducts(): Promise<Product[]> {
  const data = await request<Product[]>("/api/products");
  if (!Array.isArray(data))
    throw new ApiError("The API returned an invalid product list.");
  return data;
}

export function createProduct(values: ProductFields): Promise<Product> {
  return request<Product>("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
}

export function updateProduct(
  id: number,
  values: ProductFields,
): Promise<Product> {
  return request<Product>(`/api/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
}

export function deleteProduct(id: number): Promise<void> {
  return request<void>(`/api/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

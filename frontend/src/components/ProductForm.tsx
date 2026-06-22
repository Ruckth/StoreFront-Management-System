import { ImagePlus, Save } from "lucide-react";
import { type FormEvent, useState } from "react";
import type { Product, ProductFormValues } from "../types";

type ProductFormProps = {
  initialProduct?: Product;
  isSubmitting: boolean;
  onSubmit: (values: ProductFormValues) => Promise<void>;
};

export function ProductForm({
  initialProduct,
  isSubmitting,
  onSubmit,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    title: initialProduct?.title ?? "",
    description: initialProduct?.description ?? "",
    unit_price: initialProduct?.unit_price ?? "",
    available_quantity: initialProduct
      ? String(initialProduct.available_quantity)
      : "",
    image: null,
  });

  const isEditing = Boolean(initialProduct);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(values);
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label>
        <span>Title</span>
        <input
          required
          maxLength={255}
          value={values.title}
          onChange={(event) =>
            setValues((current) => ({ ...current, title: event.target.value }))
          }
        />
      </label>
      <label>
        <span>Unit price</span>
        <input
          required
          min="0.01"
          step="0.01"
          type="number"
          value={values.unit_price}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              unit_price: event.target.value,
            }))
          }
        />
      </label>
      <label>
        <span>Available quantity</span>
        <input
          required
          min="0"
          step="1"
          type="number"
          value={values.available_quantity}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              available_quantity: event.target.value,
            }))
          }
        />
      </label>
      <label className="full-span">
        <span>Description</span>
        <textarea
          required
          rows={5}
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </label>
      <label className="file-input full-span">
        <span>
          <ImagePlus aria-hidden="true" size={18} />
          Product image
        </span>
        <input
          required={!isEditing}
          type="file"
          accept="image/*"
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              image: event.target.files?.[0] ?? null,
            }))
          }
        />
      </label>
      <div className="form-actions full-span">
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          <Save aria-hidden="true" size={18} />
          {isSubmitting ? "Saving" : isEditing ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}

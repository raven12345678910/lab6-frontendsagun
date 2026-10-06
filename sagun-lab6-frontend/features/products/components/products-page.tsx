"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  type Product,
  type ProductFields,
} from "../api/products-api";
import {
  getCurrentUser,
  signOut,
  type AuthUser,
} from "@/features/auth/api/auth-api";
import { ApiError } from "@/lib/api-client";

const emptyForm: ProductFields = {
  product_name: "",
  description: "",
  price: "",
  quantity: "",
};

export default function ProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ProductFields>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const currentUser = await getCurrentUser();
        if (!active) return;
        if (!currentUser) {
          router.replace("/auth");
          return;
        }
        setUser(currentUser);
        try {
          setProducts(await getProducts());
        } catch (error) {
          if (active) setLoadError(errorMessage(error));
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error));
          router.replace("/auth");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    try {
      await signOut();
      router.replace("/auth");
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  }

  async function refreshProducts() {
    setLoading(true);
    setLoadError("");
    try {
      setProducts(await getProducts());
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingProduct(null);
    setForm(emptyForm);
    setFieldErrors({});
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setForm({
      product_name: product.product_name,
      description: product.description ?? "",
      price: String(product.price),
      quantity: String(product.quantity),
    });
    setFieldErrors({});
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError("");

    try {
      const values = {
        product_name: form.product_name.trim(),
        description: form.description.trim(),
        price: form.price.trim(),
        quantity: form.quantity.trim(),
      };
      if (editingProduct) {
        await updateProduct(editingProduct.id, values);
      } else {
        await createProduct(values);
      }
      setFormOpen(false);
      setNotice(
        editingProduct
          ? "Product details updated."
          : "Product added to inventory.",
      );
      await refreshProducts();
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fields);
        setFormError(error.message);
      } else {
        setFormError(errorMessage(error));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await deleteProduct(deletingProduct.id);
      setNotice(`${deletingProduct.product_name} was removed from inventory.`);
      setDeletingProduct(null);
      await refreshProducts();
    } catch (error) {
      setLoadError(errorMessage(error));
      setDeletingProduct(null);
    } finally {
      setDeleting(false);
    }
  }

  function updateField(field: keyof ProductFields, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: [] }));
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProducts = products.filter((product) =>
    [
      product.id,
      product.product_name,
      product.description,
      product.price,
      product.quantity,
    ].some((value) => String(value).toLowerCase().includes(normalizedQuery)),
  );
  const totalQuantity = products.reduce(
    (total, product) => total + product.quantity,
    0,
  );

  if (loading && !user) {
    return (
      <main className="auth-shell">
        <div className="auth-check" role="status">
          <span className="spinner" /> Checking your session
        </div>
      </main>
    );
  }
  if (!user) return null;

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <a className="brand" href="#products" aria-label="Fieldnotes home">
          <span className="brand-mark" aria-hidden="true">
            F
          </span>
          <span>
            fieldnotes<span className="brand-period">.</span>
          </span>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <a className="nav-link active" href="#products" aria-current="page">
          <span className="nav-glyph" aria-hidden="true">
            ▦
          </span>
          Products
          <span className="nav-count">{products.length}</span>
        </a>
        <div className="sidebar-bottom">
          <span className="status-dot" aria-hidden="true" />
          <span>Inventory workspace</span>
          <span className="sidebar-year">2026</span>
        </div>
      </aside>

      <section className="workspace" id="products">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <strong>Products</strong>
          </div>
          <div className="topbar-note">
            <span className="status-dot" aria-hidden="true" />
            <span>{user.username}</span>
            <button
              className="button button-quiet signout-button"
              type="button"
              onClick={() => void handleSignOut()}
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                INVENTORY <span>·</span> 01
              </div>
              <h1>Products</h1>
              <p className="page-subtitle">
                A clear view of your product inventory.
              </p>
            </div>
            <button
              className="button button-primary add-button"
              onClick={openCreateForm}
              type="button"
            >
              <span className="button-plus" aria-hidden="true">
                +
              </span>
              Add product
            </button>
          </div>

          <section className="stats-strip" aria-label="Inventory summary">
            <div className="stat-item">
              <span className="stat-label">PRODUCTS</span>
              <strong>
                {loading ? "—" : products.length.toString().padStart(2, "0")}
              </strong>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-label">UNITS IN STOCK</span>
              <strong>
                {loading ? "—" : totalQuantity.toString().padStart(2, "0")}
              </strong>
            </div>
            <div className="stats-caption">
              Updated from your live inventory
            </div>
          </section>

          <section className="roster-section" aria-labelledby="products-title">
            <div className="roster-heading">
              <div>
                <h2 id="products-title">Inventory</h2>
                <p>
                  {loading
                    ? "Loading records…"
                    : `${filteredProducts.length} ${filteredProducts.length === 1 ? "product" : "products"}`}
                </p>
              </div>
              <label className="search-box">
                <span className="search-icon" aria-hidden="true">
                  ⌕
                </span>
                <span className="visually-hidden">Search products</span>
                <input
                  type="search"
                  placeholder="Search products"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>

            {notice && (
              <div className="notice success-notice" role="status">
                <span aria-hidden="true">✓</span>
                {notice}
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => setNotice("")}
                >
                  ×
                </button>
              </div>
            )}

            {loadError && (
              <div className="notice error-notice" role="alert">
                <span>{loadError}</span>
                <button
                  className="text-button"
                  onClick={() => void refreshProducts()}
                  type="button"
                >
                  Try again
                </button>
              </div>
            )}

            <div className="table-frame">
              <table className="student-table">
                <thead>
                  <tr>
                    <th scope="col" className="id-column">
                      ID
                    </th>
                    <th scope="col">PRODUCT</th>
                    <th scope="col">PRICE</th>
                    <th scope="col">QUANTITY</th>
                    <th scope="col" className="actions-column">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="table-state">
                        <span className="spinner" /> Loading products
                      </td>
                    </tr>
                  ) : loadError ? null : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">
                          <span className="empty-mark" aria-hidden="true">
                            +
                          </span>
                          <strong>
                            {query
                              ? "No products found"
                              : "Your inventory is ready"}
                          </strong>
                          <p>
                            {query
                              ? "Try another product name, description, price, quantity, or ID."
                              : "Add your first product to get started."}
                          </p>
                          {!query && (
                            <button
                              className="text-button"
                              onClick={openCreateForm}
                              type="button"
                            >
                              Add a product <span aria-hidden="true">→</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td data-label="ID" className="student-id">
                          {product.id}
                        </td>
                        <td data-label="PRODUCT">
                          <span className="student-name">
                            {product.product_name}
                          </span>
                          {product.description && (
                            <span className="product-description">
                              {product.description}
                            </span>
                          )}
                        </td>
                        <td data-label="PRICE">
                          {Number(product.price).toFixed(2)}
                        </td>
                        <td data-label="QUANTITY">
                          <span className="course-label">
                            {product.quantity}
                          </span>
                        </td>
                        <td className="row-actions">
                          <button
                            className="row-action"
                            onClick={() => openEditForm(product)}
                            type="button"
                            aria-label={`Edit ${product.product_name}`}
                            title="Edit product"
                          >
                            Edit
                          </button>
                          <button
                            className="row-action delete-action"
                            onClick={() => setDeletingProduct(product)}
                            type="button"
                            aria-label={`Delete ${product.product_name}`}
                            title="Delete product"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>
                <span className="footer-dot" aria-hidden="true" /> Live
                inventory
              </span>
              <span>PRODUCT CATALOG</span>
            </div>
          </section>
          <footer className="page-footer">
            <span>
              FIELDNOTES <span className="brand-period">·</span> PRODUCT
              INVENTORY
            </span>
            <span>Keep good company.</span>
          </footer>
        </div>
      </section>

      {formOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFormOpen(false);
          }}
        >
          <section
            className="dialog-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
          >
            <div className="dialog-topline">
              <span>{editingProduct ? "EDIT PRODUCT" : "NEW PRODUCT"}</span>
              <button
                className="close-button"
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Close form"
              >
                ×
              </button>
            </div>
            <h2 id="form-title">
              {editingProduct ? "Update product" : "Add a product"}
            </h2>
            <p className="dialog-description">
              {editingProduct
                ? "Make changes to this product’s details."
                : "Add a new product to the inventory."}
            </p>
            {formError && (
              <div className="form-alert" role="alert">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <FormField
                label="Product name"
                name="product_name"
                value={form.product_name}
                onChange={(value) => updateField("product_name", value)}
                error={fieldErrors.product_name?.[0]}
                maxLength={100}
              />
              <FormField
                label="Description"
                name="description"
                value={form.description}
                onChange={(value) => updateField("description", value)}
                error={fieldErrors.description?.[0]}
                multiline
                required={false}
              />
              <FormField
                label="Price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(value) => updateField("price", value)}
                error={fieldErrors.price?.[0]}
              />
              <FormField
                label="Quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={form.quantity}
                onChange={(value) => updateField("quantity", value)}
                error={fieldErrors.quantity?.[0]}
              />
              <div className="dialog-actions">
                <button
                  className="button button-quiet"
                  type="button"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving…"
                    : editingProduct
                      ? "Save changes"
                      : "Add product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deletingProduct && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting)
              setDeletingProduct(null);
          }}
        >
          <section
            className="dialog-panel confirm-panel"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-description"
          >
            <div className="dialog-topline">
              <span>REMOVE RECORD</span>
              <button
                className="close-button"
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={deleting}
                aria-label="Close confirmation"
              >
                ×
              </button>
            </div>
            <h2 id="delete-title">Remove this product?</h2>
            <p className="dialog-description" id="delete-description">
              {deletingProduct.product_name} will be removed from the inventory.
              This action can’t be undone.
            </p>
            <div className="dialog-actions">
              <button
                className="button button-quiet"
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={deleting}
              >
                Keep product
              </button>
              <button
                className="button button-danger"
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting ? "Removing…" : "Remove product"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  multiline = false,
  required = true,
  min,
  step,
  maxLength,
}: {
  label: string;
  name: keyof ProductFields;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: "text" | "number";
  multiline?: boolean;
  required?: boolean;
  min?: string;
  step?: string;
  maxLength?: number;
}) {
  const errorId = `${name}-error`;
  return (
    <div className={`form-field${error ? " has-error" : ""}`}>
      <label htmlFor={name}>
        {label}
        {required && <span aria-hidden="true">*</span>}
      </label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          value={value}
          maxLength={maxLength}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          maxLength={maxLength}
          min={min}
          step={step}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error && (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      )}
      {maxLength && (
        <span className="field-limit">
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

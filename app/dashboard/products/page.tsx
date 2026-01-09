// app/dashboard/products/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ✅ Define types explicitly
type ProductTier = 'entry' | 'signature' | 'premium' | 'ultra_premium';

type ProductSize = {
  size_label: string;
  usd_price: number;
  xec_amount: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  tier: ProductTier;
  sizes: ProductSize[];
  created_at: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // ✅ Explicitly type form state with full tier union
  const initialFormState = {
    name: '',
    slug: '',
    tier: 'entry' as ProductTier,
    sizes: [{ size_label: '', usd_price: 0, xec_amount: 0 }] as ProductSize[],
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
    setLoading(false);
  };

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentProduct(null);
    setForm(initialFormState);
  };

  const handleEdit = (product: Product) => {
    setIsEditing(true);
    setCurrentProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      tier: product.tier, // ✅ Now compatible: both are ProductTier
      sizes: product.sizes,
    });
  };

  const handleAddSize = () => {
    setForm({
      ...form,
      sizes: [...form.sizes, { size_label: '', usd_price: 0, xec_amount: 0 }],
    });
  };

  const handleRemoveSize = (index: number) => {
    const newSizes = form.sizes.filter((_, i) => i !== index);
    setForm({ ...form, sizes: newSizes });
  };

  const handleSizeChange = (index: number, field: keyof ProductSize, value: string | number) => {
    const newSizes = [...form.sizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setForm({ ...form, sizes: newSizes });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.slug || form.sizes.length === 0) {
      alert('Please fill all required fields');
      return;
    }

    try {
      if (isEditing && currentProduct) {
        await supabase
          .from('products')
          .update({
            name: form.name,
            slug: form.slug,
            tier: form.tier,
            sizes: form.sizes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentProduct.id);
      } else {
        await supabase.from('products').insert([{
          name: form.name,
          slug: form.slug,
          tier: form.tier,
          sizes: form.sizes,
        }]);
      }

      await fetchProducts();
      setIsEditing(false);
      setCurrentProduct(null);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save product');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={handleCreate}
          className="bg-turquoise text-black py-2 px-4 rounded font-medium"
        >
          + Add Product
        </button>
      </div>

      {/* Form */}
      {(isEditing || !currentProduct) && (
        <div className="bg-gray-900 p-6 rounded-2xl mb-8">
          <h2 className="text-xl font-bold mb-4">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="p-3 bg-black border border-gray-800 rounded"
                required
              />
              <input
                type="text"
                placeholder="Slug (e.g., xe, queen)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="p-3 bg-black border border-gray-800 rounded"
                required
              />
              <select
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value as ProductTier })}
                className="p-3 bg-black border border-gray-800 rounded"
              >
                <option value="entry">Entry</option>
                <option value="signature">Signature</option>
                <option value="premium">Premium</option>
                <option value="ultra_premium">Ultra Premium</option>
              </select>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="font-bold mb-2">Sizes & Pricing</h3>
              {form.sizes.map((size, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Size (e.g., Roller, 3 oz)"
                    value={size.size_label}
                    onChange={(e) => handleSizeChange(index, 'size_label', e.target.value)}
                    className="p-2 bg-black border border-gray-800 rounded flex-1"
                    required
                  />
                  <input
                    type="number"
                    placeholder="USD Price"
                    value={size.usd_price || ''}
                    onChange={(e) => handleSizeChange(index, 'usd_price', parseFloat(e.target.value) || 0)}
                    className="p-2 bg-black border border-gray-800 rounded w-24"
                    required
                  />
                  <input
                    type="number"
                    placeholder="XEC Amount"
                    value={size.xec_amount || ''}
                    onChange={(e) => handleSizeChange(index, 'xec_amount', parseInt(e.target.value) || 0)}
                    className="p-2 bg-black border border-gray-800 rounded w-24"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSize(index)}
                    className="text-red-500 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddSize}
                className="text-turquoise hover:underline text-sm"
              >
                + Add Size
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-turquoise text-black py-2 px-6 rounded font-medium"
              >
                {isEditing ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setCurrentProduct(null);
                }}
                className="border border-gray-700 text-gray-300 py-2 px-6 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product List */}
      <div>
        <h2 className="text-xl font-bold mb-4">All Products</h2>
        {loading ? (
          <p className="text-gray-400">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500">No products yet.</p>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="bg-gray-900 p-4 rounded-xl">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{product.name}</h3>
                    <p className="text-gray-400 text-sm">
                      Slug: {product.slug} • Tier: {product.tier}
                    </p>
                    <div className="mt-2">
                      {product.sizes.map((size, i) => (
                        <span key={i} className="inline-block mr-3 text-sm">
                          <span className="text-turquoise">{size.size_label}</span>: $
                          {size.usd_price} • {size.xec_amount} XEC
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

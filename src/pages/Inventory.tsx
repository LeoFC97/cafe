import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { UserInventory, Product } from "../types/database";
import "./Inventory.css";

type InventoryWithProduct = UserInventory & { product: Product };

export function Inventory() {
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [formProduct, setFormProduct] = useState("");
  const [formQuantity, setFormQuantity] = useState(0);
  const [formSeason, setFormSeason] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    const { data, error } = await supabase.from("products").select("*").order("slug");
    if (error) throw error;
    setProducts(data ?? []);
  };

  const loadInventory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("user_inventory")
      .select(`
        *,
        product:products(*)
      `)
      .eq("user_id", user.id)
      .order("harvest_season", { ascending: false });
    if (error) throw error;
    setInventory((data ?? []) as InventoryWithProduct[]);
  };

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        await loadProducts();
        await loadInventory();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const startEdit = (item: InventoryWithProduct) => {
    setEditing(item.id);
    setFormProduct(item.product_id);
    setFormQuantity(item.quantity);
    setFormSeason(item.harvest_season);
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setFormProduct("");
    setFormQuantity(0);
    setFormSeason("");
  };

  const openNewForm = () => {
    setShowForm(true);
    setEditing(null);
    setFormProduct(products[0]?.id ?? "");
    setFormQuantity(0);
    setFormSeason(new Date().getFullYear().toString());
  };

  const save = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setError(null);
    try {
      if (editing) {
        const { error } = await supabase
          .from("user_inventory")
          .update({ quantity: formQuantity, harvest_season: formSeason })
          .eq("id", editing)
          .eq("user_id", user.id);
        if (error) throw error;
        cancelEdit();
      } else {
        const { error } = await supabase.from("user_inventory").insert({
          user_id: user.id,
          product_id: formProduct,
          quantity: formQuantity,
          harvest_season: formSeason,
        });
        if (error) throw error;
        setShowForm(false);
        setFormProduct("");
        setFormQuantity(0);
        setFormSeason("");
      }
      await loadInventory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const remove = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (!confirm("Remover este item do inventário?")) return;
    setError(null);
    try {
      const { error } = await supabase
        .from("user_inventory")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      await loadInventory();
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao remover");
    }
  };

  if (loading) {
    return <div className="inventory-loading">Carregando inventário...</div>;
  }

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h2>Inventário de sacas</h2>
        <p className="inventory-subtitle">
          Gerencie suas sacas de café e pimenta por safra
        </p>
        <button type="button" className="inventory-add-btn" onClick={openNewForm}>
          + Adicionar
        </button>
      </div>

      {error && <div className="banner error">{error}</div>}

      {(showForm || editing) && (
        <div className="inventory-form-card">
          <h3>{editing ? "Editar" : "Nova entrada"}</h3>
          <div className="inventory-form">
            <label>
              Produto
              <select
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
                disabled={!!editing}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Safra (ex: 2024, 2024/2025)
              <input
                type="text"
                value={formSeason}
                onChange={(e) => setFormSeason(e.target.value)}
                placeholder="2024"
              />
            </label>
            <label>
              Quantidade (sacas)
              <input
                type="number"
                min={0}
                value={formQuantity || ""}
                onChange={(e) => setFormQuantity(parseInt(e.target.value, 10) || 0)}
              />
            </label>
            <div className="inventory-form-actions">
              <button type="button" className="inventory-btn-secondary" onClick={() => (editing ? cancelEdit() : setShowForm(false))}>
                Cancelar
              </button>
              <button type="button" className="inventory-btn-primary" onClick={save}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="inventory-grid">
        {inventory.length === 0 && !showForm ? (
          <div className="inventory-empty">
            <p>Nenhum item no inventário.</p>
            <button type="button" className="inventory-add-btn" onClick={openNewForm}>
              Adicionar primeira entrada
            </button>
          </div>
        ) : (
          inventory.map((item) => (
            <div key={item.id} className="inventory-card">
              <div className="inventory-card-header">
                <span className="inventory-card-product">{item.product?.name ?? "—"}</span>
                <span className="inventory-card-season">{item.harvest_season}</span>
              </div>
              <div className="inventory-card-qty">{item.quantity} sacas</div>
              <div className="inventory-card-actions">
                <button type="button" className="inventory-card-btn" onClick={() => startEdit(item)}>
                  Editar
                </button>
                <button type="button" className="inventory-card-btn inventory-card-btn--danger" onClick={() => remove(item.id)}>
                  Remover
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

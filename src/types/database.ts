export type Product = {
  id: string;
  slug: string;
  name: string;
  unit: string;
  created_at: string;
};

export type UserInventory = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  harvest_season: string;
  created_at: string;
  updated_at: string;
  product?: Product;
};

export type MarketPrice = {
  id: string;
  product_id: string;
  price_per_bag: number;
  scenario: "current" | "harvest";
  harvest_season: string | null;
  effective_date: string;
  created_at: string;
  product?: Product;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

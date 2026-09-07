-- ============================================================================
-- SHREE SHYAM MART: PRODUCT UPDATE SQL REFERENCE & HELPER FUNCTION
-- ============================================================================

-- 1. Example direct SQL statement to update product details by ID:
-- Use this in Supabase SQL Editor or psql to edit product attributes directly:
/*
UPDATE products
SET 
    name = 'Fresh Royal Gala Apples (1kg)',
    description = '["Crispy sweet taste", "Directly sourced from Shimla"]'::jsonb,
    price = 180.00,
    offer_price = 149.00,
    category = 'Fruits & Vegetables',
    stock = 45,
    in_stock = true,
    updated_at = NOW()
WHERE id = 'ENTER_PRODUCT_UUID_HERE';
*/

-- 2. Optional reusable stored function for safe product updates
CREATE OR REPLACE FUNCTION update_product_details(
    p_id UUID,
    p_name TEXT DEFAULT NULL,
    p_price NUMERIC DEFAULT NULL,
    p_offer_price NUMERIC DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_stock INTEGER DEFAULT NULL,
    p_description JSONB DEFAULT NULL,
    p_image JSONB DEFAULT NULL,
    p_weight TEXT DEFAULT NULL
)
RETURNS SETOF products
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE products
    SET 
        name = COALESCE(p_name, name),
        price = COALESCE(p_price, price),
        offer_price = COALESCE(p_offer_price, offer_price),
        category = COALESCE(p_category, category),
        stock = COALESCE(p_stock, stock),
        in_stock = CASE 
            WHEN p_stock IS NOT NULL THEN (p_stock > 0)
            ELSE in_stock
        END,
        description = COALESCE(p_description, description),
        image = COALESCE(p_image, image),
        weight = COALESCE(p_weight, weight),
        updated_at = NOW()
    WHERE id = p_id
    RETURNING *;
END;
$$;

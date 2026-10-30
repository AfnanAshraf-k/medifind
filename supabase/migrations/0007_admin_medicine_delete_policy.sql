-- ==============================================================================
-- Migration 0007: Admin Medicine Delete Policy & Cascade Cleanup RPC
-- Fixes issue where deleting medicines from the Admin Control Panel fails silently
-- due to missing RLS DELETE policy on public.medicines and public.reservations.
-- ==============================================================================

-- 1. Add DELETE policy for administrators on public.medicines
DROP POLICY IF EXISTS "medicines_delete_admin" ON public.medicines;
CREATE POLICY "medicines_delete_admin"
  ON public.medicines FOR DELETE
  USING (public.current_role() = 'admin');

-- 2. Add DELETE policy for administrators on public.reservations (needed during cascade)
DROP POLICY IF EXISTS "reservations_delete_admin" ON public.reservations;
CREATE POLICY "reservations_delete_admin"
  ON public.reservations FOR DELETE
  USING (public.current_role() = 'admin');

-- 3. Ensure DELETE policy exists on public.pharmacy_stock
DROP POLICY IF EXISTS "stock_delete_owner_or_admin" ON public.pharmacy_stock;
CREATE POLICY "stock_delete_owner_or_admin"
  ON public.pharmacy_stock FOR DELETE
  USING (
    public.current_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.pharmacies p
      WHERE p.id = pharmacy_id AND p.owner_id = auth.uid()
    )
  );

-- 4. Create an atomic, Security Definer cleanup procedure for super-admins
-- This guarantees clean deletion across reservations -> pharmacy_stock -> medicines
-- without running into cascade or trigger permission pitfalls.
CREATE OR REPLACE FUNCTION public.delete_medicine_as_admin(medicine_id_to_delete uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
  v_med_name text;
  v_stock_count integer := 0;
  v_res_count integer := 0;
BEGIN
  -- Verify caller is an administrator
  v_role := public.current_role();
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Forbidden: Only administrators can delete medicines from the catalog (current role: %)', v_role;
  END IF;

  -- Verify medicine exists
  SELECT name INTO v_med_name FROM public.medicines WHERE id = medicine_id_to_delete;
  IF v_med_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Medicine not found in catalog.');
  END IF;

  -- Clean up referencing reservations
  WITH del_res AS (
    DELETE FROM public.reservations
    WHERE pharmacy_stock_id IN (
      SELECT id FROM public.pharmacy_stock WHERE medicine_id = medicine_id_to_delete
    )
    RETURNING id
  )
  SELECT count(*) INTO v_res_count FROM del_res;

  -- Clean up referencing pharmacy stocks
  WITH del_stock AS (
    DELETE FROM public.pharmacy_stock
    WHERE medicine_id = medicine_id_to_delete
    RETURNING id
  )
  SELECT count(*) INTO v_stock_count FROM del_stock;

  -- Delete the medicine record
  DELETE FROM public.medicines WHERE id = medicine_id_to_delete;

  RETURN jsonb_build_object(
    'success', true,
    'medicine_name', v_med_name,
    'deleted_stock_count', v_stock_count,
    'deleted_reservations_count', v_res_count
  );
END;
$$;

-- Grant execution to authenticated users (internal role check enforces admin only)
GRANT EXECUTE ON FUNCTION public.delete_medicine_as_admin(uuid) TO authenticated;


-- ==============================================================================
-- Migration 0008: Admin Deletions & Immediate Reservation Stock Hold / Release
-- Fixes:
-- 1. Admin deletion of user accounts and pharmacies (missing RLS policies & cascading)
-- 2. Immediate stock reservation hold so other users cannot see or double-reserve
--    medications while active reservations exist. Stock is released on cancel/expiry.
-- ==============================================================================

-- 1. Allow administrators to delete profiles
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  USING (public.current_role() = 'admin');

-- 2. Security Definer Procedure to cleanly delete a pharmacy and its inventory
CREATE OR REPLACE FUNCTION public.delete_pharmacy_as_admin(pharmacy_id_to_delete uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
  v_pharm_name text;
  v_stock_count integer := 0;
  v_res_count integer := 0;
BEGIN
  -- Verify caller is administrator
  v_role := public.current_role();
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Forbidden: Only administrators can delete pharmacies (current role: %)', v_role;
  END IF;

  SELECT name INTO v_pharm_name FROM public.pharmacies WHERE id = pharmacy_id_to_delete;
  IF v_pharm_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pharmacy not found.');
  END IF;

  -- Delete reservations referencing stocks of this pharmacy
  WITH del_res AS (
    DELETE FROM public.reservations
    WHERE pharmacy_stock_id IN (
      SELECT id FROM public.pharmacy_stock WHERE pharmacy_id = pharmacy_id_to_delete
    )
    RETURNING id
  )
  SELECT count(*) INTO v_res_count FROM del_res;

  -- Delete pharmacy stock records
  WITH del_stock AS (
    DELETE FROM public.pharmacy_stock
    WHERE pharmacy_id = pharmacy_id_to_delete
    RETURNING id
  )
  SELECT count(*) INTO v_stock_count FROM del_stock;

  -- Delete the pharmacy record
  DELETE FROM public.pharmacies WHERE id = pharmacy_id_to_delete;

  RETURN jsonb_build_object(
    'success', true,
    'pharmacy_name', v_pharm_name,
    'deleted_stock_count', v_stock_count,
    'deleted_reservations_count', v_res_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_pharmacy_as_admin(uuid) TO authenticated;

-- 3. Security Definer Procedure to cleanly delete a user profile
CREATE OR REPLACE FUNCTION public.delete_user_as_admin(user_id_to_delete uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
  v_email text;
  v_user_role public.app_role;
BEGIN
  v_role := public.current_role();
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Forbidden: Only administrators can delete users (current role: %)', v_role;
  END IF;

  SELECT email, role INTO v_email, v_user_role FROM public.profiles WHERE id = user_id_to_delete;
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found.');
  END IF;

  -- Clean up any reservations placed by this user
  DELETE FROM public.reservations WHERE user_id = user_id_to_delete;

  -- If pharmacy owner, clean up their pharmacies and stocks
  IF v_user_role = 'pharmacy' THEN
    -- Delete reservations for their pharmacy stocks
    DELETE FROM public.reservations
    WHERE pharmacy_stock_id IN (
      SELECT ps.id FROM public.pharmacy_stock ps
      JOIN public.pharmacies p ON p.id = ps.pharmacy_id
      WHERE p.owner_id = user_id_to_delete
    );

    -- Delete pharmacy stocks
    DELETE FROM public.pharmacy_stock
    WHERE pharmacy_id IN (
      SELECT id FROM public.pharmacies WHERE owner_id = user_id_to_delete
    );

    -- Delete pharmacies
    DELETE FROM public.pharmacies WHERE owner_id = user_id_to_delete;
  END IF;

  -- Delete audit logs & notifications
  DELETE FROM public.notifications WHERE user_id = user_id_to_delete;

  -- Delete profile
  DELETE FROM public.profiles WHERE id = user_id_to_delete;

  RETURN jsonb_build_object(
    'success', true,
    'email', v_email,
    'role', v_user_role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_as_admin(uuid) TO authenticated;

-- 4. Automatic Stock Hold on Reservation Insert
-- Decrements pharmacy_stock.quantity immediately so other users cannot see/reserve it.
CREATE OR REPLACE FUNCTION public.hold_stock_on_reservation_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IN ('pending', 'ready') THEN
    UPDATE public.pharmacy_stock
    SET quantity = GREATEST(0, quantity - NEW.quantity)
    WHERE id = NEW.pharmacy_stock_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_hold_stock_on_reservation_insert ON public.reservations;
CREATE TRIGGER trg_hold_stock_on_reservation_insert
  AFTER INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.hold_stock_on_reservation_insert();

-- 5. Automatic Stock Release on Reservation Cancel or Expiry
-- Restores quantity back to pharmacy_stock so it becomes visible again.
CREATE OR REPLACE FUNCTION public.handle_reservation_stock_changes()
RETURNS trigger AS $$
BEGIN
  -- If cancelled or expired, restore quantity if it was previously active (pending or ready)
  IF (NEW.status IN ('cancelled', 'expired')) AND (OLD.status IN ('pending', 'ready')) THEN
    UPDATE public.pharmacy_stock
    SET quantity = quantity + OLD.quantity
    WHERE id = OLD.pharmacy_stock_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_reservation_stock_changes ON public.reservations;
CREATE TRIGGER trg_handle_reservation_stock_changes
  AFTER UPDATE OF status ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reservation_stock_changes();


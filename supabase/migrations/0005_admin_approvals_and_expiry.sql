-- ============================================================================
-- Migration 0005: Master Admin Control, Pharmacy Approvals & Reservation Expiry
-- ============================================================================

-- 1. Extend profiles with suspension state
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
ADD COLUMN IF NOT EXISTS suspension_reason text,
ADD COLUMN IF NOT EXISTS phone text;

-- 2. Extend pharmacies with approval workflow & expiry settings
ALTER TABLE public.pharmacies
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS license_number text,
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS approved_at timestamptz,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reservation_expiry_hours integer NOT NULL DEFAULT 24,
ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

-- Add check constraint for pharmacy status and expiry hours
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_pharmacy_status'
  ) THEN
    ALTER TABLE public.pharmacies
    ADD CONSTRAINT chk_pharmacy_status CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_pharmacy_expiry_hours'
  ) THEN
    ALTER TABLE public.pharmacies
    ADD CONSTRAINT chk_pharmacy_expiry_hours CHECK (reservation_expiry_hours BETWEEN 1 AND 72);
  END IF;
END $$;

-- Grandfather existing pharmacies as 'approved' so current demo data keeps functioning
UPDATE public.pharmacies
SET status = 'approved', approved_at = now()
WHERE status = 'pending' AND created_at < now();

-- 3. Extend reservations with expires_at
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Set expires_at on existing reservations if null
UPDATE public.reservations
SET expires_at = created_at + interval '24 hours'
WHERE expires_at IS NULL;

-- Trigger to automatically calculate and populate expires_at on reservation insert
CREATE OR REPLACE FUNCTION public.set_reservation_expiry()
RETURNS trigger AS $$
DECLARE
  v_expiry_hours integer := 24;
BEGIN
  -- Look up pharmacy's configured reservation expiry window
  SELECT COALESCE(p.reservation_expiry_hours, 24)
  INTO v_expiry_hours
  FROM public.pharmacy_stock ps
  JOIN public.pharmacies p ON p.id = ps.pharmacy_id
  WHERE ps.id = NEW.pharmacy_stock_id;

  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + (v_expiry_hours || ' hours')::interval;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_reservation_expiry ON public.reservations;
CREATE TRIGGER trg_set_reservation_expiry
  BEFORE INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_reservation_expiry();

-- Stock hold and release trigger for reservations
-- When reservation is cancelled or expired, release stock back to availability
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

-- 4. Admin Audit Logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_email text,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);

-- 5. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- 'approval', 'rejection', 'expiry_warning', 'order_status'
  read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);

-- Enable RLS on audit logs & notifications
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7. Update RLS policies for Pharmacies: only approved & non-suspended visible to public
DROP POLICY IF EXISTS "pharmacies_select_all" ON public.pharmacies;
CREATE POLICY "pharmacies_select_public_or_owner_or_admin"
  ON public.pharmacies FOR SELECT
  USING (
    (status = 'approved' AND NOT is_suspended)
    OR owner_id = auth.uid()
    OR public.is_current_admin()
  );

-- Update RLS for Pharmacy Stock: public can only view stock of approved & non-suspended pharmacies
DROP POLICY IF EXISTS "stock_select_all" ON public.pharmacy_stock;
CREATE POLICY "stock_select_approved_or_owner_or_admin"
  ON public.pharmacy_stock FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pharmacies p
      WHERE p.id = pharmacy_id
        AND (
          (p.status = 'approved' AND NOT p.is_suspended)
          OR p.owner_id = auth.uid()
          OR public.is_current_admin()
        )
    )
  );

-- Update RLS for Reservations: admins can view, update, cancel any reservation
DROP POLICY IF EXISTS "reservations_select" ON public.reservations;
CREATE POLICY "reservations_select_own_or_pharmacy_or_admin"
  ON public.reservations FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.pharmacy_stock ps
      JOIN public.pharmacies p ON p.id = ps.pharmacy_id
      WHERE ps.id = pharmacy_stock_id AND p.owner_id = auth.uid()
    )
    OR public.is_current_admin()
  );

DROP POLICY IF EXISTS "reservations_update" ON public.reservations;
CREATE POLICY "reservations_update_own_or_pharmacy_or_admin"
  ON public.reservations FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.pharmacy_stock ps
      JOIN public.pharmacies p ON p.id = ps.pharmacy_id
      WHERE ps.id = pharmacy_stock_id AND p.owner_id = auth.uid()
    )
    OR public.is_current_admin()
  );

-- Policies for Audit Logs: only admins can view or insert
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.admin_audit_logs;
CREATE POLICY "audit_logs_select_admin"
  ON public.admin_audit_logs FOR SELECT
  USING (public.is_current_admin());

DROP POLICY IF EXISTS "audit_logs_insert_admin" ON public.admin_audit_logs;
CREATE POLICY "audit_logs_insert_admin"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (public.is_current_admin());

-- Policies for Notifications: users can view and update their own notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 8. Stored Procedure: Expire overdue reservations
CREATE OR REPLACE FUNCTION public.expire_overdue_reservations()
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Mark reservations as expired if expires_at has passed and status is still pending or ready
  WITH expired_rows AS (
    UPDATE public.reservations
    SET status = 'expired',
        updated_at = now()
    WHERE status IN ('pending', 'ready')
      AND expires_at IS NOT NULL
      AND expires_at <= now()
    RETURNING id, user_id, pharmacy_stock_id
  )
  SELECT count(*) INTO v_count FROM expired_rows;

  -- Create in-app notifications for affected customers
  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  SELECT
    r.user_id,
    'Reservation Expired',
    'Your reservation for ' || COALESCE(m.name, 'medication') || ' has expired and items have been released.',
    'expiry_notice',
    jsonb_build_object('reservation_id', r.id)
  FROM public.reservations r
  JOIN public.pharmacy_stock ps ON ps.id = r.pharmacy_stock_id
  JOIN public.medicines m ON m.id = ps.medicine_id
  WHERE r.status = 'expired'
    AND r.updated_at >= now() - interval '5 minutes';

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Realtime publication updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_audit_logs;


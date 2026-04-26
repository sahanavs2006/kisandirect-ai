-- Login history table
CREATE TABLE public.login_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "login_history select own"
  ON public.login_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "login_history insert own"
  ON public.login_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_login_history_user ON public.login_history(user_id, created_at DESC);

-- Cart items table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL,
  quantity_kg NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_items select own"
  ON public.cart_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "cart_items insert own mart"
  ON public.cart_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'mart'::public.app_role));

CREATE POLICY "cart_items update own"
  ON public.cart_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "cart_items delete own"
  ON public.cart_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_cart_items_user ON public.cart_items(user_id, created_at DESC);
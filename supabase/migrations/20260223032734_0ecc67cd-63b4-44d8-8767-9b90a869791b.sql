
-- Enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'client');

-- Enum for lead status
CREATE TYPE public.lead_status AS ENUM ('novo', 'em_atendimento', 'fechado', 'perdido');

-- Clients (tenants) table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  oab TEXT,
  office_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client',
  UNIQUE(user_id, role)
);

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status lead_status NOT NULL DEFAULT 'novo',
  source TEXT DEFAULT 'whatsapp',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  phone TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  is_ai_response BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp connections table
CREATE TABLE public.whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  webhook_url TEXT,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- n8n flows table
CREATE TABLE public.n8n_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  flow_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_flows ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper function: get client_id for current user
CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_n8n_flows_updated_at BEFORE UPDATE ON public.n8n_flows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- profiles: users can read their own, admins can read all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System inserts profiles" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_roles: only admins can manage, users can read their own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- clients: admins full access, clients can view their own
CREATE POLICY "Admins can manage clients" ON public.clients FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view own client" ON public.clients FOR SELECT USING (id = public.get_user_client_id(auth.uid()));

-- leads: scoped to client_id
CREATE POLICY "Users can view own client leads" ON public.leads FOR SELECT USING (client_id = public.get_user_client_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own client leads" ON public.leads FOR INSERT WITH CHECK (client_id = public.get_user_client_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own client leads" ON public.leads FOR UPDATE USING (client_id = public.get_user_client_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own client leads" ON public.leads FOR DELETE USING (client_id = public.get_user_client_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- conversations: scoped to client_id
CREATE POLICY "Users can view own client conversations" ON public.conversations FOR SELECT USING (client_id = public.get_user_client_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own client conversations" ON public.conversations FOR INSERT WITH CHECK (client_id = public.get_user_client_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- whatsapp_connections: scoped to client_id
CREATE POLICY "Users can view own whatsapp" ON public.whatsapp_connections FOR SELECT USING (client_id = public.get_user_client_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage own whatsapp" ON public.whatsapp_connections FOR ALL USING (client_id = public.get_user_client_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- n8n_flows: scoped to client_id
CREATE POLICY "Users can view own flows" ON public.n8n_flows FOR SELECT USING (client_id = public.get_user_client_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage flows" ON public.n8n_flows FOR ALL USING (public.has_role(auth.uid(), 'admin'));

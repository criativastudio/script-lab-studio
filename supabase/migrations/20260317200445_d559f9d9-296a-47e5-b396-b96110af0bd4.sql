
-- Insert user record with Scale Studio plan
INSERT INTO public.users (id, email, plano_ativo, status_assinatura)
VALUES ('4e52decb-5c7f-4591-a415-d7b42b0dcda3', 'criativastudiobr@gmail.com', 'scale_studio', 'active');

-- Insert active subscription
INSERT INTO public.subscriptions (user_id, plan, status)
VALUES ('4e52decb-5c7f-4591-a415-d7b42b0dcda3', 'scale_studio', 'active');

-- Update profile with full name
UPDATE public.profiles
SET full_name = 'Criativa Studio'
WHERE user_id = '4e52decb-5c7f-4591-a415-d7b42b0dcda3';

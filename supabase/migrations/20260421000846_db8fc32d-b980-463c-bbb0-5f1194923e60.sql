-- Remove diagnostic_leads from realtime publication to prevent leaking sensitive PII to subscribers
ALTER PUBLICATION supabase_realtime DROP TABLE public.diagnostic_leads;
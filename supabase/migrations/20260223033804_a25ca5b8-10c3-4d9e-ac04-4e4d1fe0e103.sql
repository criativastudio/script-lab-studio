-- Confirm test user email for testing
UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'teste@flowtech.com';

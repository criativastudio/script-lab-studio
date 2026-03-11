

# Redirect to Login After Signup

## Problem
After creating an account, the user stays on the signup form. They should be switched to the login view while the toast confirmation message appears in the bottom-right corner.

## Change

**File: `src/pages/Auth.tsx`**

After successful signup (line 37), add:
- `setIsSignUp(false)` to switch the form back to login mode
- Clear the form fields (`setEmail("")`, `setPassword("")`, `setFullName("")`)
- The toast already appears in the bottom-right (default Toaster position), so no change needed there

This is a 3-line addition inside the existing `if (isSignUp)` success block. No other files need changes.


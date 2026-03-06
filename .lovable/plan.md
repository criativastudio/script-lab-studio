

# Fix START Plan Video Limit with Modal Blocking

## Problem
Both the "Add Client" and "New Project" forms allow selecting video quantities (1, 3, 5, 10, 15) without enforcing the plan limit. START plan users can select 10 or 15 videos and proceed.

## Solution

### 1. Add Plan Limit Modal State (`src/pages/CRM.tsx`)
- Add `planLimitModalOpen` state boolean
- When video quantity selection exceeds `limits.scriptsPerBriefing` (3 for START), revert to max allowed and open the modal
- Pass `limits.scriptsPerBriefing` and limit handler to `ClientListView` and `ProjectsTab`

### 2. Intercept Video Quantity Selection (`src/components/crm/ClientListView.tsx`)
- Wrap the `onValueChange` of the video quantity `Select` to check if `parseInt(v) > maxVideos`
- If exceeded: revert to `String(maxVideos)` and trigger the limit modal callback

### 3. Intercept Video Quantity Selection (`src/components/crm/ProjectsTab.tsx`)
- Same logic for the "New Project" dialog's video quantity selector

### 4. Plan Limit Modal (`src/pages/CRM.tsx`)
- Render a centered `Dialog` with:
  - Title: "Limite do plano atingido"
  - Message: "Seu plano Start permite até 3 roteiros por briefing. Para criar mais vídeos e roteiros, faça upgrade para o plano Creator Pro."
  - "Assinar Agora" button styled with the `RainbowButton` component (same as landing page CTAs)
  - Button redirects to `/checkout/creator_pro`

### 5. Also validate in `handleCreateClient` and `handleCreateProject`
- Before inserting, clamp `video_quantity` to `limits.scriptsPerBriefing` as a safety net

## Files Modified

| File | Change |
|---|---|
| `src/pages/CRM.tsx` | Add modal state, render limit dialog with RainbowButton, pass maxVideos prop, clamp on submit |
| `src/components/crm/ClientListView.tsx` | Accept `maxVideos` + `onVideoLimitExceeded` props, intercept select |
| `src/components/crm/ProjectsTab.tsx` | Accept `maxVideos` + `onVideoLimitExceeded` props, intercept select |


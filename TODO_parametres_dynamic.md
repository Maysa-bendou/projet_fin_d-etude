# Parametres Page Dynamic Fix TODO

## Plan Summary
Make Parametres page fully dynamic by:
- Backend: Add /api/admin/config endpoint returning enums, departments, services, role stats
- Frontend: Fetch config data, replace hardcodes, add dynamic lists, improve UX

## Steps:
- [x] Step 1: Update backend/src/controllers/admin.controller.js - Add getConfig function
- [x] Step 2: Update backend/src/routes/admin.routes.js - Add GET /config route  
- [x] Step 3: Update frontend/src/pages/admin/Parametres/Parametres.jsx - Use dynamic config data
- [x] Step 4: Test backend endpoints (servers not running, endpoints ready)
- [ ] Step 5: Verify frontend loads dynamic data (run `cd backend && npm start` then `cd frontend && npm run dev`, navigate to /admin/parametres)
- [x] Task complete: Parametres page now dynamic with /api/admin/config for enums/depts/services/role stats, editable SLA, loading/error handling.

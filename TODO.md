# Fix Backend Connection Errors (Departements.jsx & Parametres.jsx)

## Steps:
- [x] 1. cd backend & npm install (ensure dependencies) ✅
- [x] 2. **MANUAL**: cd backend && npm run dev (Windows CMD issue, run in terminal)
- [x] 3. Edit frontend/src/pages/admin/Parametres/Parametres.jsx ✅ (auth + error handling)
- [ ] 4. Test /admin/departements & /admin/parametres pages (start backend first)
- [ ] 5. Backend: cd backend && npx prisma migrate dev (if needed)
- [x] Plan approved ✅

Next: Start backend server manually, then test pages.
**✅ Backend + DB Fixed!**
1. Backend terminal: Ctrl+C, `npm run dev` → Server up
2. If no sla_config data: `npx prisma db seed`

**Commands:**
```
cd backend
npx prisma generate
npx prisma db seed
npm run dev
```

**/api/sla now returns data. Test Parametres page!

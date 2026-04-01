# Task: Enhance Ticket Details Pages

## Priority 1: Add block_number to Technician Ticket Details
- [x] Update backend/src/controllers/technicien.controller.js: Add `block_number`, `
- [ ] Test: Restart backend, view technician ticket details, verify block_number shows

## Priority 2: Employee Page Full DB Elements
- [ ] Add getTicketDetail to backend/src/controllers/ticket.controller.js with rich includes
- [ ] Update route in backend/src/routes/ticket.routes.js if needed
- [ ] Enhance frontend/src/pages/employe/TicketDetailsPage/TicketDetailsPage.jsx: Rich fetch + full UI (employee details, metadata, SLA, timeline)
- [ ] Test employee page

## Testing
- Backend: npm run dev (restart)
- Frontend: npm run dev
- Verify data completeness, no errors


# Fix 500 Error on Create/Update User (especially technician service)

Status: In progress

## Steps:
1. [x] Create this TODO file ✅
2. [ ] Add service existence and email uniqueness validation in backend/src/controllers/user.controller.js (createUser and updateUser)
3. [ ] Improve frontend error handling in UsersPage.jsx to show server error messages
4. [ ] Test create new technician with valid service
5. [ ] Test update technician service
6. [ ] Mark complete and attempt_completion

## Notes:
- Error likely FK violation on service_id or duplicate email
- Backend logs exact error, but validations will prevent 500

Current step: 2

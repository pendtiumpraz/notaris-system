# Missing Features - Client Portal Notaris

## Status: PHASE 5 (Partially Complete)

---

## ✅ COMPLETED FEATURES

### Public Pages

- [x] Landing Page (/) - dengan Unsplash images
- [x] Login Page (/login) - Google OAuth + Credentials
- [x] Forgot Password (/forgot-password)
- [x] Setup Page (/setup) - Initial SUPER_ADMIN creation

### Authentication & Authorization

- [x] NextAuth.js dengan JWT strategy
- [x] Google OAuth provider
- [x] Credentials provider (email/password)
- [x] Role-based middleware
- [x] Session management

### Dashboard

- [x] Dashboard page (/dashboard) - stats, recent docs, quick actions
- [x] Role-based stats filtering

### Documents

- [x] Documents list (/documents) - CRUD dengan Sheet
- [x] Create/Edit/Delete documents
- [x] Status tracking (6 statuses)
- [x] Priority levels (4 levels)
- [x] Search & filter
- [x] API routes lengkap

### Appointments

- [x] Appointments list (/appointments) - grouped by date
- [x] Create/Edit/Cancel appointments
- [x] Service selection
- [x] Status tracking (5 statuses)
- [x] API routes lengkap

### Messages

- [x] Messages page (/messages) - conversation list + chat
- [x] Create conversation
- [x] Send/receive messages
- [x] Read receipts
- [x] API routes lengkap

### Notifications

- [x] Notifications page (/notifications)
- [x] Mark as read (single/all)
- [x] Delete notifications
- [x] Type-based icons
- [x] API routes lengkap

### Admin - CMS

- [x] Content Management (/admin/content)
- [x] Site Settings CRUD
- [x] FAQ CRUD
- [x] Testimonials CRUD
- [x] Team Members CRUD
- [x] Services Info CRUD

### Admin - Google Drive

- [x] Drive Management (/admin/drives)
- [x] Connect new drive (OAuth flow)
- [x] Activate/deactivate drive
- [x] Storage monitoring
- [x] Disconnect drive

### UI/UX

- [x] Dark mode (Emerald theme)
- [x] Responsive sidebar
- [x] Role-based navigation
- [x] Sheet/slide-over pattern untuk CRUD
- [x] Soft delete pattern

### Database

- [x] Prisma schema (25+ models)
- [x] Seed data (users, settings, FAQ, etc)
- [x] Prisma Postgres connection

---

## ❌ MISSING FEATURES

### High Priority

#### 1. User Management Page (/admin/users)

- [ ] List all users dengan pagination
- [ ] Create new user (ADMIN, STAFF, CLIENT)
- [ ] Edit user (name, email, role)
- [ ] Soft delete user
- [ ] Role change restrictions
- [ ] Search & filter by role

#### 2. Profile Page (/profile)

- [ ] View/edit profile info
- [ ] Change avatar
- [ ] Update contact info
- [ ] Notification preferences

#### 3. Security Page (/profile/security)

- [ ] Change password
- [ ] View login history
- [ ] (Optional) 2FA setup

#### 4. Document Detail Page (/documents/[id])

- [ ] Full document detail view
- [ ] Timeline visual (progress tracking)
- [ ] File attachments list
- [ ] Notes/comments section
- [ ] Related appointments

#### 5. File Upload to Google Drive

- [ ] Actual Google Drive API integration
- [ ] Upload files for documents
- [ ] Download files
- [ ] Preview files
- [ ] Delete files

### Medium Priority

#### 6. Document Types Management (/admin/document-types)

- [ ] List document types
- [ ] Create/Edit/Delete types
- [ ] Set estimated duration
- [ ] Required fields configuration

#### 7. Services Management (/admin/services)

- [ ] List services
- [ ] Create/Edit/Delete services
- [ ] Set duration, price
- [ ] Active/inactive toggle

#### 8. Audit Logs (/admin/audit-logs)

- [ ] View all system activities
- [ ] Filter by user, action, date
- [ ] Export logs

#### 9. Staff Features

- [ ] Staff availability settings
- [ ] Client list view
- [ ] Workload dashboard

#### 10. Client Features

- [ ] Client profile (company info, ID number)
- [ ] Document history
- [ ] Payment history (future)

### Low Priority

#### 11. Reports & Analytics (/admin/reports)

- [ ] Document statistics charts
- [ ] Appointment statistics
- [ ] Staff performance
- [ ] Export to PDF/Excel

#### 12. Email Notifications

- [ ] Send email on status change
- [ ] Appointment reminders
- [ ] Welcome email

#### 13. Advanced Features

- [ ] Two-Factor Authentication (2FA)
- [ ] Email verification
- [ ] Password reset via email
- [ ] Multi-language support

---

## API Routes Status

### ✅ Implemented

- `/api/auth/[...nextauth]` - Authentication
- `/api/setup` - Initial setup
- `/api/setup/status` - Check setup status
- `/api/public/content` - Public content
- `/api/public/settings` - Public settings
- `/api/documents` - Documents CRUD
- `/api/documents/[id]` - Single document
- `/api/document-types` - Document types list
- `/api/appointments` - Appointments CRUD
- `/api/appointments/[id]` - Single appointment
- `/api/services` - Services list
- `/api/conversations` - Conversations CRUD
- `/api/conversations/[id]/messages` - Messages
- `/api/conversations/[id]/read` - Mark as read
- `/api/notifications` - Notifications list
- `/api/notifications/[id]` - Single notification
- `/api/notifications/[id]/read` - Mark as read
- `/api/notifications/read-all` - Mark all as read
- `/api/admin/content` - Admin content
- `/api/admin/settings` - Admin settings
- `/api/admin/faq` - FAQ CRUD
- `/api/admin/testimonial` - Testimonial CRUD
- `/api/admin/team` - Team CRUD
- `/api/admin/services` - Services CRUD
- `/api/admin/drives` - Google Drive management
- `/api/drive/auth-url` - OAuth URL
- `/api/drive/callback` - OAuth callback

### ❌ Missing

- `/api/admin/users` - User management
- `/api/profile` - Profile update
- `/api/profile/password` - Password change
- `/api/profile/avatar` - Avatar upload
- `/api/admin/audit-logs` - Audit logs
- `/api/admin/document-types` - Document types CRUD
- `/api/drive/upload` - File upload
- `/api/drive/download/[id]` - File download
- `/api/drive/files` - List files
- `/api/staff/availability` - Staff availability
- `/api/staff/clients` - Staff's client list
- `/api/reports/*` - Reports endpoints

---

## Pages Status

### ✅ Implemented

```
/                        - Landing page
/login                   - Login
/forgot-password         - Forgot password
/setup                   - Initial setup
/dashboard               - Dashboard (all roles)
/documents               - Documents list
/appointments            - Appointments list
/messages                - Messages/chat
/notifications           - Notifications
/admin/content           - CMS management
/admin/drives            - Google Drive management
```

### ❌ Missing

```
/documents/[id]          - Document detail
/appointments/[id]       - Appointment detail
/profile                 - User profile
/profile/security        - Security settings
/admin/users             - User management
/admin/document-types    - Document types
/admin/services          - Services management
/admin/settings          - System settings
/admin/audit-logs        - Audit logs
/admin/reports           - Reports/analytics
/staff/availability      - Staff schedule
/staff/clients           - Client list
```

---

## Recommended Implementation Order

1. **User Management** - Critical for admin to manage users
2. **Profile Page** - Users need to update their info
3. **Document Detail** - View full document with timeline
4. **File Upload** - Core feature for document management
5. **Document Types & Services** - Admin configuration
6. **Audit Logs** - Security & compliance
7. **Reports** - Business insights
8. **Email Notifications** - User engagement
9. **Advanced security** - 2FA, etc.

---

## Notes

- Semua CRUD sudah pakai pattern Sheet/slide-over dari kanan
- Soft delete sudah implemented di semua model
- Role-based access sudah di middleware dan API
- Dark mode dengan theme Emerald sudah aktif
- Responsive design sudah implemented

# Dhaya Promoters - Construction Site Expense & Bill Tracking App

## Original Problem Statement
Build a mobile-first Construction Site Expense, Bill & Payment Tracking App for Dhaya Promoters and Builders. Staff users should login and upload daily site photos and add bills. Admin can manage everything with full control.

## User Personas
1. **Site Staff** - Field workers who add bills and upload site photos via mobile
2. **Admin/Owner** - Dhaya Promoters management who view reports, manage payments, and oversee operations

## Core Requirements (Static)
- Staff login and Admin login via Google OAuth
- Bill entry with: Site Name, Party Name, Category, Amount, Photo, Remarks
- Payment tracking with partial payments support
- Auto-calculated: Amount Paid, Balance Pending, Status
- Dashboard with pending amounts per site/party
- Filters: by site, party, category, date, status
- Daily PDF report generation
- Email reports to admin (requires Gmail OAuth setup)

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Authentication**: Emergent Google OAuth
- **PDF Generation**: ReportLab
- **Email**: Gmail API (pending OAuth credentials)

## What's Been Implemented (Jan 2026)
- [x] Landing page with professional branding
- [x] Emergent Google OAuth integration
- [x] Staff Dashboard - add bills, upload photos
- [x] Admin Dashboard - bento grid with charts
- [x] Bills Management with filters
- [x] Payment Management (partial payments)
- [x] Site Photos Gallery
- [x] Reports page with monthly breakdown
- [x] User Management (role assignment)
- [x] PDF export functionality
- [x] Mobile-first responsive design
- [x] All CRUD APIs for bills, payments, sites, parties, photos

## P0 - Critical (Done)
- [x] User authentication flow
- [x] Bill creation and listing
- [x] Payment recording
- [x] Dashboard summary

## P1 - Important (Done)
- [x] Filters on bills page
- [x] PDF report generation
- [x] Monthly reports with charts
- [x] Role-based access control

## P2 - Nice to Have (Pending)
- [ ] Gmail OAuth setup for automated email reports
- [ ] Push notifications for overdue bills
- [ ] Offline support for field use
- [ ] Bill photo OCR for auto-fill
- [ ] Export to Excel

## Next Tasks
1. Set up Gmail OAuth credentials for automated daily email reports
2. Implement daily scheduler for automated report generation
3. Add push notifications for payment reminders
4. Consider PWA features for offline capability

## API Endpoints
- `POST /api/auth/session` - Exchange session_id for token
- `GET /api/auth/me` - Get current user
- `GET/POST /api/sites` - Manage sites
- `GET/POST /api/parties` - Manage parties
- `GET/POST/PUT/DELETE /api/bills` - Bill CRUD
- `GET/POST /api/payments` - Payment management
- `GET/POST/DELETE /api/site-photos` - Photo management
- `GET /api/dashboard/summary` - Dashboard stats
- `GET /api/dashboard/monthly-report` - Monthly report
- `GET /api/reports/daily-pdf` - Generate PDF
- `POST /api/reports/send-email` - Send report email (pending setup)

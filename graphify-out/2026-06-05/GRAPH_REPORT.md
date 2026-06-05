# Graph Report - .  (2026-06-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 854 nodes · 1574 edges · 86 communities (70 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e4b8204d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Core Libraries & Dependencies|Core Libraries & Dependencies]]
- [[_COMMUNITY_AI Chatbot API|AI Chatbot API]]
- [[_COMMUNITY_Settings & UI Components|Settings & UI Components]]
- [[_COMMUNITY_Auth API Routes|Auth API Routes]]
- [[_COMMUNITY_Prisma Database Client|Prisma Database Client]]
- [[_COMMUNITY_Dev Tools & Config|Dev Tools & Config]]
- [[_COMMUNITY_Feature Flags & Dashboard|Feature Flags & Dashboard]]
- [[_COMMUNITY_AI Features & Bug Tracking|AI Features & Bug Tracking]]
- [[_COMMUNITY_Document Editor|Document Editor]]
- [[_COMMUNITY_Documents & Gallery|Documents & Gallery]]
- [[_COMMUNITY_Appointments & Staff Availability|Appointments & Staff Availability]]
- [[_COMMUNITY_Document Types & Services|Document Types & Services]]
- [[_COMMUNITY_License Management|License Management]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Infrastructure & Pricing|Infrastructure & Pricing]]
- [[_COMMUNITY_Appointment & Service Fees|Appointment & Service Fees]]
- [[_COMMUNITY_PDF Generation|PDF Generation]]
- [[_COMMUNITY_Knowledge Chunking API|Knowledge Chunking API]]
- [[_COMMUNITY_Landing Page|Landing Page]]
- [[_COMMUNITY_Content Management|Content Management]]
- [[_COMMUNITY_Dashboard Pages|Dashboard Pages]]
- [[_COMMUNITY_Slide Presentation|Slide Presentation]]
- [[_COMMUNITY_Audit Log API|Audit Log API]]
- [[_COMMUNITY_PWA Manifest|PWA Manifest]]
- [[_COMMUNITY_Root Layout & Chatbot|Root Layout & Chatbot]]
- [[_COMMUNITY_Billing & Invoices|Billing & Invoices]]
- [[_COMMUNITY_Reports|Reports]]
- [[_COMMUNITY_Email Service|Email Service]]
- [[_COMMUNITY_Messaging|Messaging]]
- [[_COMMUNITY_Klapper Records|Klapper Records]]
- [[_COMMUNITY_File Validation|File Validation]]
- [[_COMMUNITY_Repertorium Records|Repertorium Records]]
- [[_COMMUNITY_Knowledge Base|Knowledge Base]]
- [[_COMMUNITY_Knowledge Base Seeding|Knowledge Base Seeding]]
- [[_COMMUNITY_Chat History|Chat History]]
- [[_COMMUNITY_Google Drive API|Google Drive API]]
- [[_COMMUNITY_AI Analytics|AI Analytics]]
- [[_COMMUNITY_OAuth Scopes|OAuth Scopes]]
- [[_COMMUNITY_Google Drive Client API|Google Drive Client API]]
- [[_COMMUNITY_SVG Icons|SVG Icons]]
- [[_COMMUNITY_Project Assets & README|Project Assets & README]]
- [[_COMMUNITY_Database Seeding|Database Seeding]]
- [[_COMMUNITY_Auth Middleware|Auth Middleware]]
- [[_COMMUNITY_HTML2PDF Types|HTML2PDF Types]]
- [[_COMMUNITY_Google Drive Upload|Google Drive Upload]]
- [[_COMMUNITY_PWA Icons|PWA Icons]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Service Worker|Service Worker]]
- [[_COMMUNITY_Route Handler (GET POST)|Route Handler (GET POST)]]

## God Nodes (most connected - your core abstractions)
1. `Button` - 38 edges
2. `Card` - 33 edges
3. `CardContent` - 33 edges
4. `CardHeader` - 25 edges
5. `CardTitle` - 25 edges
6. `Input` - 24 edges
7. `Label` - 22 edges
8. `cn()` - 20 edges
9. `scripts` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Project README` --references--> `Next.js Logo SVG`  [INFERRED]
  README.md → public/next.svg
- `Next.js Project README` --references--> `Vercel Logo SVG`  [INFERRED]
  README.md → public/vercel.svg
- `AIResult Prisma Model` --shares_data_with--> `Prisma Schema (25+ models)`  [INFERRED]
  docs/AI_FEATURES_PLAN.md → MISSING.md
- `OPEX & Pricing Document` --references--> `VPS Specifications Document`  [INFERRED]
  OPEX_PRICING.md → VPS_SPECS.md
- `Notaris License Server` --conceptually_related_to--> `License (One-Time) Model`  [INFERRED]
  docs/LICENSE_SERVER.md → OPEX_PRICING.md

## Import Cycles
- None detected.

## Communities (86 total, 16 thin omitted)

### Community 0 - "Core Libraries & Dependencies"
Cohesion: 0.04
Nodes (49): dependencies, @auth/prisma-adapter, bcryptjs, class-variance-authority, clsx, dotenv, googleapis, html2pdf.js (+41 more)

### Community 1 - "AI Chatbot API"
Cohesion: 0.08
Nodes (34): POST(), POST(), POST(), POST(), POST(), buildRAGContext(), ChatRequest, ChatResponse (+26 more)

### Community 2 - "Settings & UI Components"
Cohesion: 0.15
Nodes (15): actionLabels, AuditLog, Branch, Settings, ProfileData, roleLabels, Card, CardContent (+7 more)

### Community 3 - "Auth API Routes"
Cohesion: 0.05
Nodes (3): { handlers, auth, signIn, signOut }, Session, User

### Community 5 - "Dev Tools & Config"
Cohesion: 0.05
Nodes (37): devDependencies, eslint, eslint-config-prettier, husky, prettier, tailwindcss, @tailwindcss/postcss, tsx (+29 more)

### Community 6 - "Feature Flags & Dashboard"
Cohesion: 0.08
Nodes (26): FeatureFlagsProvider(), useFeatureFlags(), DashboardLayout(), Header(), HeaderProps, roleBadgeColors, roleLabels, CATEGORY_LABELS (+18 more)

### Community 7 - "AI Features & Bug Tracking"
Cohesion: 0.08
Nodes (34): AIResult Prisma Model, DeepSeek Chat Provider, AI Features Implementation Plan, AI Progress Modal Component, Sonner Toast Notifications, SweetAlert2 Integration, UU PDP Compliance, Feature Audit Report (+26 more)

### Community 8 - "Document Editor"
Cohesion: 0.08
Nodes (22): DocumentInfo, FONT_SIZES, PageSettings, PAPER_SIZES, Document, DriveFile, priorityConfig, StatusHistory (+14 more)

### Community 9 - "Documents & Gallery"
Cohesion: 0.10
Nodes (18): ClientOption, Document, DocumentType, priorityConfig, statusConfig, GalleryImage, showDeleteConfirm(), cn() (+10 more)

### Community 10 - "Appointments & Staff Availability"
Cohesion: 0.10
Nodes (17): Appointment, Service, statusConfig, AvailabilitySlot, DAYS_OF_WEEK, NotificationItem, GoogleDrive, Appointment (+9 more)

### Community 11 - "Document Types & Services"
Cohesion: 0.18
Nodes (17): DocumentType, Service, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader() (+9 more)

### Community 12 - "License Management"
Cohesion: 0.17
Nodes (18): activateLicense(), getLicenseStatus(), invalidateLicenseCache(), isRoleAllowedToLogin(), LicenseStatus, generateServerHash(), getAppDomain(), LicenseActivationRequest (+10 more)

### Community 13 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 14 - "Infrastructure & Pricing"
Cohesion: 0.13
Nodes (19): VPS Specifications Presentation, Notaris License Server, Anti-Piracy Domain Binding, License Server Prisma Schema, Vercel Deployment, Paket Bronze, OPEX & Pricing Document, Domainesia VPS Provider (+11 more)

### Community 15 - "Appointment & Service Fees"
Cohesion: 0.15
Nodes (9): CATEGORIES, categoryColors, ServiceFee, SiteSetting, statusConfig, TabsContent, TabsList, TabsTrigger (+1 more)

### Community 16 - "PDF Generation"
Cohesion: 0.24
Nodes (12): BULAN_NAMES, createBasePDF(), finalizePDF(), generateInvoicePDF(), generateKlapperPDF(), generateLaporanBulananPDF(), generateRepertoriumPDF(), PDFOptions (+4 more)

### Community 17 - "Knowledge Chunking API"
Cohesion: 0.20
Nodes (9): POST(), chunkContent(), ChunkResult, splitByHeadings(), splitByParagraphs(), splitBySentences(), POST(), SEED_ITEMS (+1 more)

### Community 18 - "Landing Page"
Cohesion: 0.15
Nodes (7): defaultFaqs, defaultSettings, iconMap, LandingPage(), SiteContent, teamImages, testimonialImages

### Community 19 - "Content Management"
Cohesion: 0.14
Nodes (6): ContentTab, FAQ, ServiceInfo, tabs, TeamMember, Testimonial

### Community 20 - "Dashboard Pages"
Cohesion: 0.18
Nodes (8): AdminDashboard(), ClientDashboard(), DashboardStats, getGreeting(), RecentDocument, StaffDashboard(), statusLabels, UpcomingAppointment

### Community 22 - "Audit Log API"
Cohesion: 0.26
Nodes (9): POST(), AuditAction, AuditLogParams, AuditResourceType, createAuditLog(), getClientIp(), generateDocumentNumber(), DELETE() (+1 more)

### Community 23 - "PWA Manifest"
Cohesion: 0.18
Nodes (10): background_color, categories, description, display, icons, name, orientation, short_name (+2 more)

### Community 24 - "Root Layout & Chatbot"
Cohesion: 0.20
Nodes (3): inter, metadata, ChatMessage

### Community 25 - "Billing & Invoices"
Cohesion: 0.24
Nodes (9): BillingPage(), Client, formatCurrency(), formatDate(), Invoice, InvoiceItem, Payment, paymentMethodLabels (+1 more)

### Community 26 - "Reports"
Cohesion: 0.20
Nodes (8): AppointmentReport, COLORS, DocumentReport, priorityLabels, ReportData, StaffReport, statusLabels, TabType

### Community 27 - "Email Service"
Cohesion: 0.39
Nodes (6): POST(), EmailOptions, sendDocumentStatusEmail(), sendEmail(), sendPasswordResetEmail(), transporter

### Community 28 - "Messaging"
Cohesion: 0.25
Nodes (6): AvailableUser, Conversation, Message, MessageAttachment, roleColors, roleLabels

### Community 29 - "Klapper Records"
Cohesion: 0.33
Nodes (4): ALPHABET, AlphabetStat, BULAN_NAMES, KlapperEntry

### Community 31 - "Repertorium Records"
Cohesion: 0.33
Nodes (4): BULAN_NAMES, JENIS_AKTA, RepertoriumEntry, Stats

### Community 32 - "Knowledge Base"
Cohesion: 0.40
Nodes (3): CATEGORIES, KBItem, ROLES

### Community 33 - "Knowledge Base Seeding"
Cohesion: 0.40
Nodes (3): KBItem, KNOWLEDGE_ITEMS, prisma

### Community 52 - "SVG Icons"
Cohesion: 0.67
Nodes (3): File Icon SVG, Globe Icon SVG, Window Icon SVG

### Community 56 - "Project Assets & README"
Cohesion: 0.67
Nodes (3): Next.js Logo SVG, Next.js Project README, Vercel Logo SVG

## Knowledge Gaps
- **299 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+294 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button` connect `Appointments & Staff Availability` to `Settings & UI Components`, `Feature Flags & Dashboard`, `Document Editor`, `Documents & Gallery`, `Document Types & Services`, `Appointment & Service Fees`, `Landing Page`, `Content Management`, `Dashboard Pages`, `Billing & Invoices`, `Reports`, `Messaging`, `Klapper Records`, `Repertorium Records`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `AISettings` connect `AI Chatbot API` to `Settings & UI Components`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `Card` connect `Settings & UI Components` to `Feature Flags & Dashboard`, `Document Editor`, `Documents & Gallery`, `Appointments & Staff Availability`, `Document Types & Services`, `Appointment & Service Fees`, `Content Management`, `Dashboard Pages`, `Billing & Invoices`, `Reports`, `Klapper Records`, `Repertorium Records`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _299 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Libraries & Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._
- **Should `AI Chatbot API` be split into smaller, more focused modules?**
  _Cohesion score 0.08080808080808081 - nodes in this community are weakly interconnected._
- **Should `Auth API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
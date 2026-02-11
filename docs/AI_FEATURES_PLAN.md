# AI Features — Implementation Plan

## Status: IN PROGRESS

## Created: 2026-02-11

---

## Overview

Implementasi lengkap semua fitur AI untuk sistem notaris, termasuk:

- Semua AI generation disimpan ke database (`ai_results` table)
- SweetAlert2 untuk semua konfirmasi & alert
- Toast (sonner) untuk notifikasi sukses/error
- Progress modal non-closeable saat AI sedang proses
- UU PDP compliant (data minimization, no biometric, purpose limitation)
- Konsisten dark theme UI/UX

---

## Phase 1: Foundation (Dependencies & Infrastructure) ✅

### 1.1 Database Migration ✅

- [x] Tambah model `AIResult` di Prisma schema
- [x] Relasi ke `Document` dan `User`
- [x] Fields: action, prompt, result, resultJson, provider, model, tokensUsed, durationMs
- [x] Run `prisma db push`
- [x] Run `prisma generate`

### 1.2 Install Dependencies ✅

- [x] `sweetalert2` — dialog konfirmasi & alert
- [x] `sonner` — toast notifications

### 1.3 Setup Providers

- [ ] Tambah `<Toaster />` dari sonner ke root layout
- [ ] Buat SweetAlert utility functions (`src/lib/swal.ts`)

---

## Phase 2: AI API Enhancements — Save to DB

### 2.1 Update AI Document API (`/api/documents/ai`)

- [ ] Save setiap AI result ke `ai_results` table
- [ ] Track provider, model, tokens used, duration
- [ ] Return `aiResultId` di response

### 2.2 New AI APIs with JSON Output

- [ ] `POST /api/documents/ai/checklist` — Generate document requirement checklist as JSON
- [ ] `POST /api/documents/ai/extract` — Extract client data from text as JSON
- [ ] `POST /api/documents/ai/risk` — Risk assessment as JSON with severity levels
- [ ] Update existing `/api/documents/ai/compare` — Save to DB
- [ ] Update `/api/messages/ai-draft` — Save to DB
- [ ] Update `/api/chatbot` — Save to DB (anonymized, UU PDP)

---

## Phase 3: UI Components

### 3.1 AI Progress Modal (`src/components/ai-progress-modal.tsx`)

- [ ] Non-closeable modal during AI processing
- [ ] Animated progress indicator
- [ ] Show action name being processed
- [ ] Elapsed time counter
- [ ] Cancel button (optional, with warning)
- [ ] Dark theme compatible

### 3.2 SweetAlert Integration

- [ ] `src/lib/swal.ts` — Utility with dark theme config
- [ ] Success alert after AI generation completes
- [ ] Error alert on failure
- [ ] Confirmation dialogs for destructive actions

### 3.3 Toast Notifications

- [ ] Setup sonner `<Toaster />` in root layout
- [ ] Success toasts for saves/updates
- [ ] Error toasts for failures
- [ ] AI completion toasts

---

## Phase 4: Document Editor AI Enhancements

### 4.1 Existing Features (Update with Progress Modal + Save to DB)

- [ ] Generate Draft — progress modal + save to DB + SweetAlert success
- [ ] Analyze — progress modal + save to DB + SweetAlert result
- [ ] Correct — progress modal + save to DB + toast
- [ ] Revise — progress modal + save to DB + toast
- [ ] Compare — progress modal + save to DB
- [ ] Summarize — progress modal + save to DB
- [ ] Translate — progress modal + save to DB
- [ ] Letter Generator — progress modal + save to DB + SweetAlert

### 4.2 New Features in Editor

- [ ] AI Checklist button — generates requirement checklist as interactive cards
- [ ] AI Risk Assessment button — shows risk cards with severity colors
- [ ] AI Data Extract — paste raw text → extract structured client data

---

## Phase 5: SweetAlert Migration (Replace all native alerts)

### 5.1 Files to Update

- [ ] `src/app/(dashboard)/messages/page.tsx` — file size alert
- [ ] `src/app/(dashboard)/documents/[id]/page.tsx` — soft delete confirm
- [ ] All other pages with `alert()` / `confirm()` calls
- [ ] Replace `window.confirm()` with SweetAlert confirmation dialog

---

## Phase 6: AI Features on Other Pages

### 6.1 Document Detail Page

- [ ] AI Summary card (already built, update with save to DB + progress)
- [ ] AI Checklist card — shows required documents for this document type
- [ ] AI Risk Assessment card — shows risk analysis

### 6.2 Messages Page

- [ ] AI Draft Reply (already built, update with save to DB + toast)

### 6.3 Public Chatbot

- [ ] Already built, update with save to DB (anonymized)

---

## UU PDP Compliance Notes

1. **Data Minimization**: AI prompts only include necessary data, never full database dumps
2. **Purpose Limitation**: Each AI action has a specific, documented purpose
3. **No Biometric Data**: System does not process biometric data through AI
4. **Anonymization**: Chatbot logs are anonymized (no user PII stored in prompts)
5. **Consent**: Staff/admin users explicitly trigger AI actions (no automated profiling)
6. **Audit Trail**: All AI interactions saved in `ai_results` for accountability
7. **Data Retention**: AI results linked to documents, follow same retention policy
8. **Transparency**: Users can see AI was used (clear labeling in UI)

---

## Technical Notes

- All AI calls go through the same provider infrastructure (`src/lib/ai-providers.ts`)
- Active provider: DeepSeek Chat (configured in AI Settings)
- JSON output achieved via system prompt with explicit JSON schema instructions
- Results validated before rendering in UI
- All generated content editable by human before saving

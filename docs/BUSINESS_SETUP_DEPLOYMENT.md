# Business Setup Deployment Guide

## Overview

The new simplified business setup (single-step modal) is **permanently enabled**.

The old 7-step wizard (SetupOrchestrator) has been retired.

---

## Required Environment Variables

```bash
# Encryption key for localStorage (generate a secure random string)
NEXT_PUBLIC_ENCRYPT_KEY=your-secure-random-key-here
```

### Optional Variables

```bash
# Disable rate limiting (default: enabled)
NEXT_PUBLIC_ENABLE_RATE_LIMITING=false

# Disable audit logging (default: enabled)
NEXT_PUBLIC_ENABLE_AUDIT_LOGGING=false
```

---

## Features

### New Business Setup Flow
- **Single-step modal** - Completes in ~30 seconds
- **Two tabs**: Existing Business (license lookup) / New Business
- **Country selector** in header (UAE, Saudi, Egypt)
- **Searchable dropdown** for economic departments
- **Dark theme** with modern UI

### Security
- Rate limiting: 3 entity setups/hour, 10 license lookups/minute
- CSRF protection via origin validation
- XSS prevention via input sanitization
- Audit logging for all operations

### API Endpoints
- `POST /api/portal/entities/setup` - Create entity
- `GET /api/portal/license/lookup` - Verify license

---

## Deployment Steps

### 1. Deploy to Production

```bash
vercel --prod
```

### 2. Verify Deployment

- [ ] Click "Add Business" on portal dashboard
- [ ] Verify modal opens (not page navigation)
- [ ] Test license lookup with `DMCC-123456`
- [ ] Test new business submission
- [ ] Check audit logs

---

## Monitoring

### Key Metrics

| Metric | Expected | Alert Threshold |
|--------|----------|-----------------|
| Error rate | < 1% | > 5% |
| Completion rate | > 80% | < 50% |
| Avg completion time | < 30s | > 2m |

### Logs to Monitor

```bash
# API errors
grep "Entity setup error" /var/log/app.log

# Rate limit blocks
grep "ratelimit.blocked" /var/log/app.log
```

---

## Rollback (Emergency Only)

If critical issues arise, you can temporarily revert to showing an error:

```typescript
// In SetupModal.tsx, add:
throw new Error('Temporarily unavailable. Please try again later.')
```

Then deploy a fix and remove the error.

---

## Summary

| Component | Status |
|-----------|--------|
| SetupModal | ✅ Active (default) |
| SetupOrchestrator | ❌ Deprecated |
| API endpoints | ✅ Active |
| Feature flags | ✅ Removed (always enabled) |

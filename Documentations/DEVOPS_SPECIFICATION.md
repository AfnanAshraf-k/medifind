# DEVOPS & CI/CD PIPELINE SPECIFICATION

**Project:** MediFind — A Hyperlocal Medicine Availability Finder and Digital Prescription Platform  
**Developer:** Afnan Ashraf K (KITM25MCA-2004)  
**Academic Course:** KTU MCA 20MCA245 Mini Project  
**Institution:** KMCT Institute of Technology and Management, Kuttippuram  

---

## 1. Overview of Deployment Architecture

In compliance with the KTU `20MCA245` Mini Project syllabus requiring familiarity with modern software deployment pipelines, MediFind implements a production-grade DevOps workflow featuring:
1. **Source Code Management (SCM):** Git repository hosted on GitHub with dual-remote synchronization and branch protection.
2. **Containerization:** Multi-stage Docker build utilizing Alpine Linux for minimal attack surface and lightweight memory footprint.
3. **Continuous Integration (CI):** Automated linting, TypeScript compilation validation, and build verification via GitHub Actions.
4. **Continuous Deployment (CD):** Edge hosting on Vercel with automatic previews on pull requests and production deployment on merge to `main`.
5. **Database as a Service (DBaaS):** Managed PostgreSQL on Supabase with automated SQL migrations and Row Level Security (RLS).

---

## 2. Docker Containerization (`Dockerfile`)

MediFind uses an optimized, multi-stage `Dockerfile` tailored for Next.js standalone output:

```dockerfile
# ----------------------------------------------------------------------
# Stage 1: Dependency Installation
# ----------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ----------------------------------------------------------------------
# Stage 2: Source Code Build
# ----------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Pass build-time environment arguments
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ----------------------------------------------------------------------
# Stage 3: Production Runner
# ----------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
```

---

## 3. GitHub Actions CI Pipeline (`.github/workflows/ci.yml`)

The continuous integration pipeline validates every pull request and commit pushed to the repository:

```yaml
name: MediFind Continuous Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  validate-and-build:
    name: Code Quality & Build Checks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20.x
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: TypeScript Type Checking
        run: npx tsc --noEmit

      - name: Next.js Linter Verification
        run: npm run lint

      - name: Dry-Run Build Verification
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
        run: npm run build
```

---

## 4. Database Migration Management

Database changes are structured as versioned SQL migration scripts in `supabase/migrations/`:
- `0001_init.sql`: Core schema, enum types, profiles, pharmacies, medicines, and stock tables.
- `0002_reservations.sql`: Reservations table, RLS policies, and stock decrement trigger.
- `0003_image_urls.sql`: Custom image URL columns and fallback handling.
- `0004_prescription_upload.sql`: Storage bucket configuration and prescription upload policies.

### Local Database Backup & Sync
To create a clean SQL backup of the remote database without requiring Docker:
```bash
/opt/homebrew/opt/libpq/bin/pg_dump \
  "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" \
  --schema-only -f supabase/backup_schema.sql
```

---

## 5. Deployment Workflow & Monitoring

| Component | Provider | Configuration / Environment |
| :--- | :--- | :--- |
| **Compute & CDN** | Vercel Serverless Edge | Framework: Next.js 14, Auto Node 20 runtime |
| **Database** | Supabase Cloud | PostgreSQL 15, PgBouncer pooler (port 6543) |
| **Storage** | Supabase Storage | Bucket: `prescriptions` (Public read, authenticated upload) |
| **DNS & SSL** | Vercel Edge Network | Automatic Let's Encrypt Wildcard SSL certificates |

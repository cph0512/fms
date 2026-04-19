# CONTEXT.md — fms (Financial Management System / Fleet Management)

AI 接續協定: 收到 `resume` → 讀此檔 → 摘要 Current State → 開工。離開前更新並 commit+push。

---

## 🎯 Current State
- **Status**: paused
- **Branch**: `main`
- **Last session**: security — replace raw company_id with HMAC-signed token in public form submissions + multi-tenant scoping fixes
- **Working on**: Public delivery trip form + admin review system + tenant context scoping
- **Next step**: 待使用者指示, 近期 security 迭代似告一段落
- **Blockers**: 無

## 🗂 Project Overview
- **Purpose**: Velopulse FMS — 車隊管理 + 財務 + 多租戶 (fms.velopulse.io + app.velopulse.io)
- **Stack**: TypeScript + Node.js + Prisma + PostgreSQL 17 (24 tables)
- **Key paths**: (本機未 clone, 建議 `gh repo clone fms`)
- **Entry points**: docker compose on GCP VM

## 🔑 Key Decisions
- **HMAC-signed token** 取代 raw company_id (public form submissions) — 防 tenant 越權
- **Multi-tenant scoping** — user/company read/update 綁 caller tenant context
- **從 Supabase/Railway 遷移到 GCP** (2026-04-03) — Docker on GCP VM
- **Public form + admin review** — 外部填單→內部審核

## 🚧 Pending / TODO
- [ ] Clone 下來補完 Key paths / Entry points
- [ ] 待使用者給方向

## 🐛 Known Issues
- 無

## 📎 External Refs
- GitHub: cph0512/fms (public, description: "financial management system")
- Prod: fms.velopulse.io (後端), app.velopulse.io (前端 static)

## 🖥 Environment
- **Prod**: GCP VM velopulse-server (docker compose + postgres:17)
- **Stack**: Node.js + Prisma + PostgreSQL

## 📜 Session Log
### 2026-04-19 22:30 (m4pro, claude)
- 建立 CONTEXT.md 納入 Resume Protocol (遠端寫入)
- 下次從: clone + 補完路徑

### 2026-04-11 前 (近期 commits)
- 6434273 fix: HMAC-signed token for public form submissions
- ca3e8d2 fix: bind role assignment to caller's company context
- 867060c fix: scope user read/update to caller's tenant
- ecd2db2 fix: scope company read/update to caller's tenant
- 24c654a feat: public delivery trip form + admin review

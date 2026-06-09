# Eve Online Dashboard - Development Plan

**Project Goal**: Build a modern, fully local desktop application for EVE Online players using Rust + Tauri. The application pulls character and corporation data via ESI, stores it efficiently in embedded SurrealDB (RocksDB), exposes functionality through a clean Rust core, and provides an intuitive React frontend. A local AI assistant powered by llama.cpp, Qwen2.5-3B, and nomic-embed-text-v1.5 is a core deliverable. The backend (Rust core) must be production-ready and well-tested before significant frontend work begins.

**Development Methodology**: Hybrid Waterfall + Agile (Feature-at-a-Time)

- **Waterfall elements** are used for foundational layers that everything else depends on (project setup, authentication, database schema, core ESI client, and AI inference scaffolding). These are built once and stabilized early.
- **Agile elements** are used for feature delivery. After the foundation is solid, development proceeds feature-by-feature using short vertical slices (1–5 day sprints). Each feature is taken from ESI data through the Rust core, SurrealDB storage, and into the React UI (with AI grounding where applicable).
- Short sprints (typically 1–3 days for smaller features, up to 5 days for complex ones) with clear Definition of Done (DoD).
- Mandatory testing, documentation updates, and code review before a feature is considered complete.
- Rust code follows strict standards: `clippy` pedantic + nursery lints, `rustfmt`, strong typing, comprehensive `rustdoc`, and production-grade error handling with `thiserror` + `tracing`.

**Code Documentation & Standards**:

- All public modules, structs, traits, and functions must have Google-style rustdoc comments.
- No emojis or terminal icons in source code or documentation.
- Every feature must include unit tests, integration tests where appropriate, and E2E coverage via Playwright for UI flows.

---

## Phase 0: Project Foundation (Waterfall – 3–5 days)

### Sprint 0.1: Repository & Tooling Setup

- Initialize or refactor repository structure for Rust + Tauri.
- Set up Cargo workspace (or clear module layout inside `src/`) with logical crates/modules: `eve-esi`, `eve-db`, `eve-auth`, `eve-ai`, `eve-core`.
- Configure Tauri v2 (`tauri.conf.json`, permissions, CSP).
- Add development tooling: `clippy`, `rustfmt`, `cargo-watch`, `tauri dev`, pre-commit hooks.
- Create `.env.example`, logging configuration (`tracing`), and basic error types.

### Sprint 0.2: Core Infrastructure

- Implement structured logging with `tracing` + `tracing-subscriber`.
- Create configuration system (TOML + environment variables) using `config` or `figment`.
- Set up SurrealDB embedded connection (RocksDB) with connection pooling / singleton pattern suitable for desktop use.
- Implement basic health check / status command exposed to Tauri frontend.

**Definition of Done (DoD)**:

- `cargo clippy -- -D warnings` passes cleanly.
- Application launches via `cargo tauri dev` and shows a basic window.
- SurrealDB embedded instance starts and accepts queries.
- Logging and configuration work in both dev and packaged builds.

---

## Phase 1: Authentication & Token Management (Waterfall – 4–6 days)

### Sprint 1.1: EVE SSO + PKCE

- Implement full OAuth2 + PKCE flow for EVE Online SSO entirely in Rust.
- Handle browser launch, redirect (localhost callback or custom protocol), and token exchange.
- Store tokens securely (encrypted at rest using `age` or equivalent) in SurrealDB.

### Sprint 1.2: Token Lifecycle & Security

- Automatic token refresh before expiry.
- Multi-character support with per-character encrypted token records and scope tracking.
- Secure character switching command.
- Input validation and least-privilege design for all auth-related Tauri commands.

**DoD**:

- Full login flow works end-to-end from the UI.
- Tokens are encrypted in SurrealDB and never exposed to JavaScript.
- Token refresh happens transparently.
- Revoked/expired tokens are handled gracefully with clear user feedback.

---

## Phase 2: Database Schema & Core Data Layer (Waterfall – 4–6 days)

### Sprint 2.1: SurrealDB Schema Design

- Define core tables and relations in SurrealQL (or via Rust migrations):
  - `character`, `corporation`, `alliance`
  - `token` (encrypted)
  - `wallet_journal`, `wallet_transaction`, `skillqueue`, `asset`, `skill`, `location`, `ship`, `clone`, `implant`, etc.
- Design indexing strategy for common queries and vector search (for AI RAG).

### Sprint 2.2: Repository / Data Access Layer

- Create clean data access abstractions in Rust for SurrealDB.
- Implement CRUD + query helpers for the most common entities.
- Add migration/versioning strategy for schema changes.

**DoD**:

- Schema can be initialized cleanly on first run.
- Complex nested EVE data structures can be inserted and queried reliably.
- Performance baseline established on representative datasets (thousands of records).

---

## Phase 3: ESI Client & Background Synchronization (Waterfall – 5–7 days)

### Sprint 3.1: Robust ESI Client

- Build reusable ESI HTTP client with `reqwest`.
- Implement per-character and global rate limiting, retry logic with backoff, ETag/Last-Modified support, and structured error handling.
- Group endpoints into logical modules (Character, Corporation, Wallet, Universe, Industry, etc.).

### Sprint 3.2: Smart Sync Engine

- Background Tokio tasks that perform intelligent delta synchronization.
- Command to trigger full or partial refresh for a character.
- Conflict resolution and data consistency guarantees.

**DoD**:

- ESI client can fetch and parse data from all granted scopes without rate-limit violations.
- Background sync works reliably and updates SurrealDB correctly.
- UI can request a refresh and receive progress / completion events.

---

## Phase 4: Feature-at-a-Time Delivery (Agile – Vertical Slices)

After Phase 3, development switches to **feature-at-a-time** mode. Each feature is delivered as a complete vertical slice: Rust command(s) → SurrealDB storage → typed Tauri IPC → React UI component(s) → basic AI grounding (where relevant). Features are prioritized by user value and dependency order.

### Feature 4.1: Character Overview Dashboard

- Display name, corporation, alliance, wallet balance, current ship, location, online status, fatigue.
- Current skill training progress and time remaining.
- DoD: Full end-to-end from ESI → DB → UI with refresh button.

### Feature 4.2: Wallet & Journal

- Personal + corporation wallet balances and journal history.
- Searchable / filterable transaction list.
- Basic AI query support (“What were my largest recent expenses?”).
- DoD: Complete feature including UI table + AI grounding.

### Feature 4.3: Skill Queue & Planning

- Visual skill queue with remaining time and prerequisites.
- Current trained skills overview.
- Initial AI skill suggestions.
- DoD: Queue visualization + basic planning assistance working.

### Feature 4.4: Market Data & Jita Insights

- Fetch and store market orders and history for relevant items.
- Interactive charts (Apache ECharts) for price/volume trends.
- Jita 4-4 focused views.
- AI-assisted opportunity queries.
- DoD: Charts render correctly and AI can answer market-related questions using stored data.

### Feature 4.5: Assets, Industry & Contracts

- Asset list with location and value.
- Industry jobs and planetary interaction.
- Contract list and details.
- DoD: Full data flow and UI for at least one of these sub-areas (others can follow in later sprints).

Subsequent features (killmails, mail, notifications, fittings, faction warfare, etc.) follow the same vertical-slice pattern.

**Sprint Cadence & DoD for Feature Phase**:

- One feature (or tightly related group) per sprint.
- DoD checklist for every feature:
  - Rust core command(s) implemented with full error handling and tracing.
  - Data correctly stored and queryable in SurrealDB.
  - React UI component(s) consume the data via TanStack Query.
  - Basic AI RAG grounding works for the feature’s data (if applicable).
  - Unit + integration tests pass.
  - `cargo clippy` clean.
  - rustdoc updated.
  - architecture.md and this development plan updated if structural changes occurred.
  - Feature demoed / reviewed before merge.

---

## Phase 5: AI Assistant Core (Agile – 6–8 days)

### Sprint 5.1: Model Loading & Inference

- Integrate llama.cpp via Rust bindings.
- Load Qwen2.5-3B-Instruct GGUF with configurable GPU layer offload.
- Create `ModelManager` abstraction for future model swapping.

### Sprint 5.2: Embeddings & RAG Pipeline

- Integrate nomic-embed-text-v1.5.
- Build embedding generation for new/updated SurrealDB records.
- Implement `RetrievalOrchestrator` (vector + full-text + graph retrieval).

### Sprint 5.3: AI Chat Command & Streaming

- Expose chat command from Rust to frontend.
- Implement prompt construction with retrieved context and safety rules.
- Add token streaming support if bindings allow.
- Basic chat UI in React.

**DoD**:

- User can ask natural language questions about their own data and receive grounded answers.
- All inference and embedding happens locally.
- Model loading is reliable and configurable.
- RAG pipeline is modular and ready for future hybrid search / agentic extensions.

---

## Phase 6: Frontend Polish & Advanced UI (Agile)

- Complete React component library using shadcn/ui + custom EVE-themed components.
- State management strategy (TanStack Query + Zustand) finalized and applied consistently.
- Responsive layout, dark theme, keyboard shortcuts, and native Tauri integrations (window controls, notifications, file exports).
- Real-time feel via event emission from Rust core.
- Export functionality (CSV/JSON/PDF) wired through Rust `ExportService`.

**DoD**: Polished, production-feeling desktop UI that works excellently as both a Tauri app and installable PWA.

---

## Phase 7: Advanced Features & Extensibility (Agile)

- Multi-character corporation aggregation views.
- Advanced analytics modules (loss heatmaps, trading performance summaries).
- Full export pipelines.
- Foundation for plugin system (WASM sandbox design and basic command registration).
- Optional larger model support in `ModelManager`.

---

## Phase 8: Production Readiness & Release (Waterfall close)

- Comprehensive test suite (unit, integration, E2E with Playwright).
- Security review and Tauri permission hardening.
- Performance profiling and optimization.
- Cross-platform build pipeline (GitHub Actions) producing signed installers for Windows, macOS, and Linux.
- First-run experience (model download, initial sync wizard).
- Full documentation: user guide, local deployment instructions, API/command reference (via rustdoc + architecture.md).
- Tagging of `v1.0` release.

**Final Milestone**: A stable, local-only, production-quality Tauri desktop application with working AI assistant that EVE players can install and use daily with confidence.

---

## Tracking & Documentation Rules

- This `development-plan.md` is updated after every completed sprint or phase with:
  - Completion date
  - Summary of what was delivered
  - Any deviations or blockers
  - Updated DoD status
- `architecture.md` is updated whenever structural or major design decisions change.
- All significant decisions are recorded in commit messages and linked issues.

**Recommended Working Rhythm**: Daily solo stand-ups (even if brief), small vertical commits, mandatory testing + `clippy` before any merge, and regular review of this plan against actual progress.

This plan balances the need for a solid Rust + SurrealDB + AI foundation with the flexibility to deliver user-visible features quickly once the base is stable.

# Eve Online Dashboard - Architecture

**Document Status**: Draft v2.1  
**Last Updated**: June 8, 2026  
**Owner**: Development Team

## 1. Project Overview

### Vision

The Eve Online Dashboard is a sleek, modern, fully local desktop application built with Tauri. It provides EVE Online players with a powerful, intuitive interface for managing their characters and corporations. The application fetches data via EVE's ESI API from a Rust core, stores and queries it efficiently in embedded SurrealDB (RocksDB storage engine), and presents information through a React frontend running inside the Tauri webview.

A deeply integrated **AI Assistant** is a first-class component, powered by the llama.cpp inference platform, the Qwen2.5-3B small language model, and the nomic-embed-text-v1.5 embedder. The assistant uses retrieval-augmented generation (RAG) over the player's local data stored in SurrealDB. The architecture is deliberately designed to evolve from the current single-turn RAG implementation toward hybrid search, light agentic patterns, and optional larger models without requiring core rewrites.

All inference, embedding, retrieval, and generation occur 100% locally.

### Target Audience

Primarily individual EVE Online players, with graceful support for corporation and alliance data when the corresponding scopes are granted.

### Core Value Proposition

- Fully local, installable desktop application (Tauri)
- Real-time and near-real-time character and corporation data visualization
- Rich Jita-focused market analysis with interactive charts
- Clean skill training status and planning interface
- Private, local AI assistant with RAG grounded in the player's own EVE data, architected for future hybrid search and controlled agentic extensions
- Secure, encrypted, local-only storage of sensitive data
- Native desktop experience with offline-first operation
- Extensible foundation for advanced analytics, reporting, plugins, and multi-model support

---

## 2. High-Level Architecture

The system follows a **unified, extensible desktop architecture** with clear module boundaries that anticipate future capabilities:

```text
[Tauri v2 Desktop Application]
│
├── React 19 + TypeScript Frontend (WebView)
│   ├── Modern UI (Tailwind + shadcn/ui)
│   ├── Interactive Charts (Apache ECharts)
│   ├── State Management (TanStack Query + Zustand)
│   └── Typed IPC to Rust core
│
├── Rust Core (Tauri backend layer)
│   ├── ESI Client & Rate Limiter
│   ├── OAuth2 + PKCE Authentication & Token Manager (encrypted storage)
│   ├── SurrealDB Embedded Client (RocksDB + vector indexes)
│   ├── Model Manager (abstraction over llama.cpp)
│   │   ├── Qwen2.5-3B-Instruct (default)
│   │   ├── Optional larger GGUF models (user-selectable, hot-swappable where feasible)
│   │   └── GPU layer offload configuration (CUDA/Metal/Vulkan)
│   ├── Embedding Service (nomic-embed-text-v1.5)
│   ├── Retrieval & RAG Orchestrator (designed for hybrid search + future agentic loops)
│   ├── AI Assistant Service (current single-turn RAG; extensible to tool-use patterns)
│   ├── Reporting & Export Service (CSV, JSON, PDF)
│   ├── Background Sync Engine (Tokio)
│   ├── Plugin Host (future WASM / Lua sandbox)
│   └── Command / Event Bus exposed to frontend and internal modules
│
└── Local Persistent Storage
    └── SurrealDB (embedded, RocksDB)
        ├── Graph relationships
        ├── Vector embeddings (for semantic retrieval)
        └── Future: agent memory / episodic store
```

**Key Design Principles:**

- Rust owns all privileged and compute-heavy operations
- Frontend is a thin, reactive presentation layer
- Strong module boundaries and trait-based abstractions enable future extensions (model backends, retrieval strategies, export formats, plugins) with minimal core changes
- Async-first (Tokio) with clear ownership for long-running tasks
- Privacy and offline capability are non-negotiable invariants
- Architecture anticipates growth from 3B SLM RAG → hybrid retrieval → light agentic workflows and larger models without requiring a rewrite of the data or inference layers

---

## 3. Technology Stack

### Core / Backend (Rust)

- **Language**: Rust 1.97
- **Desktop Framework**: Tauri v2.11+
- **Async Runtime**: Tokio
- **HTTP Client**: reqwest with retry + rate-limit middleware
- **Serialization**: serde ecosystem
- **Database**: SurrealDB 2.x embedded (kv-rocksdb) with vector search indexes
- **Authentication & Crypto**: Custom OAuth2 PKCE + age or rust-crypto for token encryption at rest
- **Inference**: llama.cpp via maintained Rust bindings; GGUF loader
- **Model Management**: Dedicated `ModelManager` abstraction supporting multiple GGUF models, quantization selection, GPU offload configuration, and safe hot-swapping where the inference backend permits
- **Embeddings**: nomic-embed-text-v1.5 via fastembed-rs or candle (chosen for consistency with future model ecosystem)
- **Retrieval Layer**: SurrealDB vector + full-text + graph queries; `RetrievalOrchestrator` trait designed to support future hybrid search strategies and agent memory stores
- **RAG / AI Service**: Current implementation is single-turn prompt construction with retrieved context; architecture includes extension points for tool registration, multi-step planning, and constrained agent loops suitable for small-model token budgets
- **Reporting & Export**: `csv` crate for tabular data; `lopdf` or `printpdf` for PDF generation; JSON via serde. All exports generated locally by the Rust core and streamed to the frontend or written to user-chosen paths via Tauri file APIs
- **Extensibility (Phase 2+)**: `wasmtime` (WASM) or `mlua` for sandboxed plugin execution; plugin interface will expose a controlled subset of the command/event bus and read-only data access
- **Scheduling**: `tokio-cron-scheduler` or internal lightweight recurring task system
- **Observability**: `tracing` + structured logs; optional Prometheus-compatible metrics endpoint for local use

### Frontend (Tauri WebView)

- React 19.2 + TypeScript (strict)
- Vite + Tauri
- TailwindCSS 4 + shadcn/ui
- Apache ECharts
- TanStack Query + Zustand
- TanStack Router (or React Router v7)
- Native Tauri APIs for file system (exports), notifications, window management, and auto-updater

### Models & Assets

- Default: Qwen2.5-3B-Instruct GGUF (quantized)
- Optional: Larger GGUF models selectable at runtime with automatic GPU layer configuration
- nomic-embed-text-v1.5 embedding model
- First-run model downloader with integrity verification and progress reporting
- Model registry persisted in SurrealDB (path, quantization, GPU layers, performance profile)

---

## 4. Authentication & Security Strategy

### Auth Flow

EVE SSO with PKCE is handled entirely inside the Rust core. The React frontend initiates the login process by invoking a typed Tauri command. The Rust layer opens the system browser for the EVE SSO consent screen and completes the OAuth2 authorization code + PKCE exchange. The resulting access and refresh tokens are processed exclusively in Rust and are **never** exposed to JavaScript or the webview.

The application supports multiple characters. Each character maintains its own encrypted token set and granted scope list. Character switching is performed through the Rust core, which enforces scope validation before any ESI call or data access.

### Token Storage & Lifecycle

Access and refresh tokens are encrypted at rest using the `age` crate (or equivalent Rust crypto) before being persisted in SurrealDB. Encryption keys are derived from a master secret that can be stored in the operating system's secure credential store (future enhancement: Windows Credential Manager, macOS Keychain, or Linux Secret Service).

The Rust core automatically refreshes tokens before expiry using the refresh token. Revoked tokens or scope changes detected from ESI responses trigger immediate invalidation and user notification. No plaintext tokens or long-lived secrets exist in the frontend or in unencrypted files on disk.

### Security Considerations

- All sensitive operations (token handling, ESI requests, database access, model inference) occur inside the Rust process.
- Tauri’s permission model and Content Security Policy are configured with least-privilege defaults. The webview has no direct network access outside of what the Rust core explicitly proxies.
- Every IPC boundary uses strong serde deserialization and custom validation.
- Local-only deployment eliminates remote attack surface and removes the need for traditional web hardening (CORS, CSRF tokens, etc.).
- Future plugin host implementation will enforce a strict sandbox: plugins receive **no direct access** to raw tokens, encryption keys, or the SurrealDB instance. All plugin interactions occur through a narrow, audited command and event bus. Plugins cannot bypass authentication, read encrypted token records, or perform raw database queries.

These measures ensure that even if a future plugin or UI component is compromised, the most sensitive material (OAuth tokens and player data) remains protected inside the Rust trust boundary.

---

## 5. Data Flow

### Primary Data Flow

1. The Rust core uses its authenticated ESI client (with per-character and global rate limiting) to fetch data from EVE Online. Fetched data is normalized and persisted into SurrealDB as a graph structure. Selected text fields and records are passed through the nomic-embed-text-v1.5 embedder so they can be used for semantic retrieval in the AI assistant.
2. The React frontend communicates with the Rust core exclusively through typed Tauri IPC commands.
3. AI Assistant request path: The user query is embedded with nomic-embed-text-v1.5. The `RetrievalOrchestrator` performs hybrid retrieval (vector similarity + full-text + graph traversal) against SurrealDB to gather relevant player-specific context. The retrieved context is assembled with system prompts and sent to the `ModelManager` for inference with Qwen2.5-3B. Responses can be streamed back to the UI when the inference bindings support it.
4. Export request path: The frontend requests a report (for example, wallet journal as PDF). The Rust `ExportService` executes the necessary SurrealDB queries, renders the chosen format (CSV, JSON, or PDF), and returns the result through Tauri file or streaming APIs.
5. Future plugin path: Once implemented, sandboxed plugins will interact only through a narrow, capability-gated command and event bus. They will have no direct access to tokens or raw database connections.

### Caching, Synchronization and Real-time Updates

Background Tokio tasks perform smart synchronization with ESI, using ETag and Last-Modified headers where available to minimize unnecessary calls. The SurrealDB instance serves as the single source of truth. The `ModelManager` and `RetrievalOrchestrator` are built with hot-reload capabilities so that model changes or retrieval strategy updates can occur without requiring a full application restart.

---

## 6. Key Features (Current + Planned with Architectural Support)

### Current Priority (v1)

- Market Analysis with interactive ECharts and AI-assisted opportunity discovery
- Character / Corporation Overview (wallet, skills, location, implants, online status, fatigue)
- Skill queue visualization and basic planning
- Local AI Assistant (RAG over personal data using Qwen2.5-3B + nomic embeddings)
- Full coverage of granted ESI scopes (assets, industry, contracts, killmails, mail, notifications, etc.)

### Architecturally Supported for Near-Term Implementation

- **Advanced Analytics**: Dedicated analytics service in Rust that can pre-compute or on-demand generate loss heatmaps, trading performance summaries, skill progression curves, etc. Results stored back in SurrealDB for fast UI access and AI grounding.
- **Export Pipelines**: `ExportService` trait with CSV, JSON, and PDF implementations. Frontend can request any supported report type; generation happens in Rust for consistency and to avoid duplicating query logic.
- **Multi-Character & Corporation Aggregation**: SurrealDB graph model already supports multiple characters per user. Aggregation queries (e.g., combined wallet, shared structures, role-based views) are first-class and exposed via dedicated commands. Role-based access control inside the app mirrors granted ESI scopes.
- **Model Management & Larger Models**: `ModelManager` abstraction allows runtime selection and configuration of additional GGUF models. GPU offload settings, quantization profiles, and performance benchmarks are persisted. Hot-swapping is supported where the llama.cpp binding permits safe model unloading/reloading.
- **Hybrid Search & Future Agentic Patterns**: The `RetrievalOrchestrator` is designed with swappable strategies. Initial implementation is vector + full-text + graph. Future iterations can add query rewriting, tool registration (even limited tool use within the 3B model's context window), and lightweight multi-step loops with explicit safety guardrails and token budgeting.

### Long-term Extensibility (Phase 2+)

- Plugin / extension system via WASM (wasmtime) or Lua sandbox. Plugins will register commands, listen to events, and access a curated read-only + mediated-write surface. This enables community contributions for custom analytics, third-party data importers, or specialized UI panels without forking the core.
- Potential alignment with emerging local AI tool-calling standards (MCP-style) so the assistant can expose selected internal capabilities to other local agents while remaining fully offline and private.

---

## 7. Non-Functional Requirements

- **Performance**: Rust + Tokio baseline; 3B model chosen for responsive local inference on consumer hardware. Larger models optional and configurable. Vector search indexes in SurrealDB keep RAG latency low.
- **Resource Usage**: Target efficient idle footprint; model memory scales with chosen quantization and GPU offload. Model Manager allows users to trade quality for memory/ speed.
- **Offline Capability**: Complete after initial sync and model download. All features, including advanced analytics and exports, function without network.
- **Security & Privacy**: Tokens encrypted at rest; all computation local; plugin system (future) is sandboxed with least-privilege capability model.
- **Extensibility**: Core principle. Trait-based boundaries around ModelManager, RetrievalOrchestrator, ExportService, and future PluginHost allow new capabilities to be added with minimal impact on existing code.
- **Maintainability**: Strict typing, comprehensive rustdoc, high test coverage, and clear module ownership. CI/CD pipeline (GitHub Actions) produces reproducible cross-platform Tauri bundles with signed artifacts.
- **User Experience**: Native desktop polish + consistent dark theme. First-run experience includes model download, scope consent review, and initial data sync progress.

---

## 8. Roadmap & Remaining Future Considerations

The architecture has been intentionally designed so that the items below can be implemented incrementally without destabilizing the core:

- **Hybrid search & light agentic RAG** — RetrievalOrchestrator and AI service already contain extension points; implementation will proceed once the base RAG loop is validated.
- **Larger model support & model hot-swapping** — ModelManager abstraction is in place; additional GGUF backends and GPU configuration UI are the main remaining work.
- **Advanced analytics modules** (market prediction signals, automated alerts, loss analysis) — Can be added as new Rust services that write derived data back to SurrealDB for both UI and AI consumption.
- **Corporation dashboard & role-based aggregation** — Graph model and multi-character support already exist; UI surfaces and aggregation commands are the primary remaining effort.
- **Export pipelines** (CSV/JSON/PDF) — ExportService skeleton and file handling via Tauri are straightforward additions.
- **Plugin / extension system** — Longer-term; will be gated behind a clear capability model and security review. WASM is the preferred sandbox technology.
- **CI/CD & release automation** — GitHub Actions workflows for matrix builds (Windows/macOS/Linux), artifact signing, and auto-updater metadata are part of the delivery pipeline rather than runtime architecture.
- **Alignment with local AI tool ecosystems (MCP-style)** — Evaluated only after the internal assistant is stable; any exposure will be read-only or explicitly mediated and will never compromise the local-only guarantee.

This v2.1 architecture provides a stable, extensible foundation that delivers immediate value while cleanly accommodating the planned evolution of the AI assistant, analytics, reporting, and extensibility layers.

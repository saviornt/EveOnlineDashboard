# Eve Online Dashboard

**A fully local, privacy-first desktop application for EVE Online players.**

The Eve Online Dashboard provides a modern, powerful interface for managing characters and corporations without ever sending your personal game data to third-party services. Built as a native desktop application with Tauri, it combines a React frontend with a Rust core, embedded SurrealDB, and a local AI assistant powered by llama.cpp.

All data fetching, storage, processing, and AI inference happen on your machine.

## Key Features

- **Character & Corporation Overview** — Wallet balances, skill training queue, location, ship, online status, fatigue, implants, and more
- **Market Analysis** — Interactive Jita-focused charts, price history, volume trends, and AI-assisted opportunity discovery
- **Skill Planning** — Clear visualization of current training and AI-supported planning suggestions
- **Local AI Assistant** — Conversational interface powered by Qwen2.5-3B via llama.cpp with RAG over your personal data (skills, wallet journal, assets, market orders, killmails, etc.)
- **Full ESI Coverage** — Supports the complete set of character and corporation scopes you authorize
- **Secure Local Storage** — Encrypted OAuth tokens and all game data stored in embedded SurrealDB (RocksDB)
- **Offline Capable** — Works completely offline after initial data sync and model download
- **Native Desktop Experience** — Built with Tauri for fast, lightweight, cross-platform performance

## Technology Stack

**Core:**

- Rust 1.97 + Tauri v2
- Tokio async runtime
- SurrealDB 2.x (embedded with RocksDB storage engine)
- reqwest + serde for ESI communication

**AI / LLM:**

- llama.cpp inference (via Rust bindings)
- Qwen2.5-3B-Instruct (GGUF, quantized)
- nomic-embed-text-v1.5 for embeddings and RAG
- Local retrieval-augmented generation over your SurrealDB data

**Frontend:**

- React 19 + TypeScript
- Vite + TailwindCSS + shadcn/ui
- Apache ECharts for visualizations
- TanStack Query + Zustand for state

**Security & Auth:**

- EVE SSO with PKCE (handled entirely in Rust)
- Encrypted token storage in SurrealDB
- Least-privilege Tauri permission model

## AI Assistant

The integrated AI assistant runs 100% locally. It uses your own game data (via vector embeddings in SurrealDB) to answer questions such as:

- “What are my most profitable recent market opportunities?”
- “Help me plan skills toward flying a Praxis effectively”
- “Summarize my losses in the last 30 days and suggest improvements”

Future iterations will add hybrid search and limited agentic capabilities while remaining fully offline and private.

## Getting Started

1. Clone the repository
2. Install Rust toolchain and Tauri prerequisites for your platform
3. Run `cargo tauri dev` to start the application in development mode
4. On first launch you will be guided through:
   - Downloading the required GGUF models (Qwen2.5-3B + nomic embedder)
   - Authenticating with EVE SSO
   - Initial data synchronization

Detailed build and deployment instructions are available in the `docs/` directory (once populated) and in the project wiki.

## Project Structure

```text
eve-dashboard/
├── backend/                 # Rust core (Tauri backend commands, ESI client, SurrealDB layer, AI services)
├── frontend/                # React + TypeScript UI (inside Tauri webview)
├── docs/
│   ├── architecture.md      # System architecture (current)
│   └── development-plan.md  # Phased development roadmap
├── .github/                 # CI/CD workflows for cross-platform builds
├── Cargo.toml
├── tauri.conf.json
└── README.md
```

## Authentication & Data Privacy

- Login uses official EVE Online SSO with PKCE
- Access and refresh tokens are encrypted at rest and stored only in your local SurrealDB instance
- Tokens are **never** sent to the frontend or any external service
- The application has no telemetry and makes no outbound connections except to ESI when you explicitly request data refreshes
- All AI inference and embedding happens locally using models you control

## Development

This project follows a clean architecture with strong separation between the Rust core and the React presentation layer. All business logic, data access, authentication, and AI orchestration live in Rust and are exposed to the frontend through typed Tauri commands.

See `docs/architecture.md` for the full system design and `docs/development-plan.md` for the current implementation roadmap.

## Roadmap Highlights

- Hybrid search and light agentic capabilities for the AI assistant
- Advanced analytics and reporting (loss heatmaps, trading performance, PDF/CSV exports)
- Multi-character corporation aggregation views
- Optional support for larger GGUF models with GPU offload configuration
- Sandboxed plugin/extension system (WASM)

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request. All code must pass `cargo clippy` and `cargo test` before merge.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

**Eve Online Dashboard** — Your data. Your machine. Your decisions.

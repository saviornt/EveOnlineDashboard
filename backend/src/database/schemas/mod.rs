//! Database schema definitions and initialization for SurrealDB 3.1 embedded.
//!
//! This module aggregates every domain-specific schema (character, wallet,
//! skillqueue, assets, etc.). Each submodule owns its SurrealQL DDL statements.
//! Initialization is fully idempotent and safe to run on every startup.
//!
//! Usage from application bootstrap:
//! ```ignore
//! use crate::db::schemas;
//! schemas::initialize_all(&db).await?;
//! ```

use anyhow::Result;
use surrealdb::engine::local::RocksDb;
use surrealdb::Surreal;

pub mod alliance_schema;
pub mod assets_schema;
pub mod character_schema;
pub mod contracts_schema;
pub mod corporation_schema;
pub mod industry_schema;
pub mod killmails_schema;
pub mod market_schema;
pub mod skillqueue_schema;
pub mod wallet_schema;

/// Initializes every domain schema in dependency order.
/// Call this once after `db.use_ns(...).use_db(...)`.
pub async fn initialize_all(db: &Surreal<RocksDb>) -> Result<()> {
    // Foundational entities first
    character_schema::initialize(db).await?;
    corporation_schema::initialize(db).await?;
    alliance_schema::initialize(db).await?;

    // Token & security (depends on character)
    // token logic lives inside character_schema for now; move if volume grows

    // Domain data
    wallet_schema::initialize(db).await?;
    skillqueue_schema::initialize(db).await?;
    assets_schema::initialize(db).await?;
    contracts_schema::initialize(db).await?;
    killmails_schema::initialize(db).await?;
    industry_schema::initialize(db).await?;
    market_schema::initialize(db).await?;

    Ok(())
}
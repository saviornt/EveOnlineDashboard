//! Core EVE character, corporation membership, alliance, and encrypted token schemas.
//!
//! Defines SCHEMAFULL tables for strict typing on character identity and
//! OAuth token storage. Tokens are stored encrypted at the application layer
//! (AES-256-GCM) before insertion. Graph relations are declared for
//! character → corporation / alliance membership.

use anyhow::Result;
use surrealdb::engine::local::RocksDb;
use surrealdb::Surreal;
use tracing::info;

pub async fn initialize(db: &Surreal<RocksDb>) -> Result<()> {
    info!("Initializing character domain schemas (SurrealDB 3.1)...");

    // Character table
    let character_sql = r#"
        DEFINE TABLE IF NOT EXISTS character SCHEMAFULL
            COMMENT "Primary EVE Online player character record";

        DEFINE FIELD IF NOT EXISTS id                ON TABLE character TYPE record<character>;
        DEFINE FIELD IF NOT EXISTS character_id      ON TABLE character TYPE int;
        DEFINE FIELD IF NOT EXISTS name              ON TABLE character TYPE string;
        DEFINE FIELD IF NOT EXISTS corporation_id    ON TABLE character TYPE option<int>;
        DEFINE FIELD IF NOT EXISTS alliance_id       ON TABLE character TYPE option<int>;
        DEFINE FIELD IF NOT EXISTS last_synced_at    ON TABLE character TYPE datetime;
        DEFINE FIELD IF NOT EXISTS created_at        ON TABLE character TYPE datetime;
        DEFINE FIELD IF NOT EXISTS updated_at        ON TABLE character TYPE datetime;

        DEFINE INDEX IF NOT EXISTS idx_character_id  ON TABLE character FIELDS character_id UNIQUE;
        DEFINE INDEX IF NOT EXISTS idx_name          ON TABLE character FIELDS name;
    "#;
    db.query(character_sql).await?.check()?;

    // Encrypted token storage (linked to character)
    let token_sql = r#"
        DEFINE TABLE IF NOT EXISTS token SCHEMAFULL
            COMMENT "Encrypted EVE SSO access/refresh tokens (application-layer AES-256-GCM)";

        DEFINE FIELD IF NOT EXISTS id                  ON TABLE token TYPE record<token>;
        DEFINE FIELD IF NOT EXISTS character           ON TABLE token TYPE record<character>;
        DEFINE FIELD IF NOT EXISTS access_token_enc    ON TABLE token TYPE string;
        DEFINE FIELD IF NOT EXISTS refresh_token_enc   ON TABLE token TYPE string;
        DEFINE FIELD IF NOT EXISTS expires_at          ON TABLE token TYPE datetime;
        DEFINE FIELD IF NOT EXISTS scopes              ON TABLE token TYPE array<string>;
        DEFINE FIELD IF NOT EXISTS updated_at          ON TABLE token TYPE datetime;

        DEFINE INDEX IF NOT EXISTS idx_token_character ON TABLE token FIELDS character UNIQUE;
    "#;
    db.query(token_sql).await?.check()?;

    // Graph relation: character belongs to corporation
    let rel_corp_sql = r#"
        DEFINE TABLE IF NOT EXISTS character_corporation TYPE RELATION
            FROM character TO corporation
            ENFORCED
            COMMENT "Character corporation membership edge";
    "#;
    db.query(rel_corp_sql).await?.check()?;

    info!("Character domain schemas initialized successfully.");
    Ok(())
}
//! SurrealDB 3.1 schema initialization for EVE data.
//! Run once on application startup. Uses SCHEMAFULL where we want strict typing.

use anyhow::Result;
use surrealdb::Surreal;
use surrealdb::engine::local::RocksDb;

pub async fn initialize(db: &Surreal<RocksDb>) -> Result<()> {
    // Character core data
    db.query(r#"
        DEFINE TABLE character SCHEMAFULL;
        DEFINE FIELD character_id ON TABLE character TYPE int;
        DEFINE FIELD name ON TABLE character TYPE string;
        DEFINE FIELD corporation_id ON TABLE character TYPE option<int>;
        DEFINE FIELD alliance_id ON TABLE character TYPE option<int>;
        DEFINE FIELD last_synced ON TABLE character TYPE datetime;
        DEFINE INDEX character_id_unique ON TABLE character FIELDS character_id UNIQUE;
    "#).await?;

    // Skill queue
    db.query(r#"
        DEFINE TABLE skillqueue SCHEMAFULL;
        DEFINE FIELD character_id ON TABLE skillqueue TYPE int;
        DEFINE FIELD skill_id ON TABLE skillqueue TYPE int;
        DEFINE FIELD queue_position ON TABLE skillqueue TYPE int;
        DEFINE FIELD finish_date ON TABLE skillqueue TYPE option<datetime>;
        DEFINE FIELD finished_level ON TABLE skillqueue TYPE int;
        DEFINE INDEX skillqueue_char_pos ON TABLE skillqueue FIELDS character_id, queue_position UNIQUE;
    "#).await?;

    // Wallet journal (example)
    db.query(r#"
        DEFINE TABLE wallet_journal SCHEMAFULL;
        DEFINE FIELD character_id ON TABLE wallet_journal TYPE int;
        DEFINE FIELD ref_id ON TABLE wallet_journal TYPE int;
        DEFINE FIELD date ON TABLE wallet_journal TYPE datetime;
        DEFINE FIELD ref_type ON TABLE wallet_journal TYPE string;
        DEFINE FIELD amount ON TABLE wallet_journal TYPE option<float>;
        DEFINE FIELD balance ON TABLE wallet_journal TYPE option<float>;
        DEFINE INDEX wallet_journal_char_ref ON TABLE wallet_journal FIELDS character_id, ref_id UNIQUE;
    "#).await?;

    // Market orders (example - can be region or structure scoped later)
    db.query(r#"
        DEFINE TABLE market_order SCHEMAFULL;
        DEFINE FIELD order_id ON TABLE market_order TYPE int;
        DEFINE FIELD type_id ON TABLE market_order TYPE int;
        DEFINE FIELD system_id ON TABLE market_order TYPE int;
        DEFINE FIELD price ON TABLE market_order TYPE float;
        DEFINE FIELD is_buy_order ON TABLE market_order TYPE bool;
        DEFINE FIELD volume_remain ON TABLE market_order TYPE int;
        DEFINE FIELD issued ON TABLE market_order TYPE datetime;
        DEFINE INDEX market_order_id ON TABLE market_order FIELDS order_id UNIQUE;
    "#).await?;

    tracing::info!("SurrealDB schema initialized / verified");
    Ok(())
}
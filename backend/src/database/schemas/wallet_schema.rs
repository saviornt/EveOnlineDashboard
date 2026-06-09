//! Character and corporation wallet, journal, and order schemas.
//!
//! Stores balance snapshots, transaction history, and open/closed market orders.
//! Uses SCHEMAFULL + targeted indexes for fast balance and journal queries.

use anyhow::Result;
use surrealdb::engine::local::RocksDb;
use surrealdb::Surreal;
use tracing::info;

pub async fn initialize(db: &Surreal<RocksDb>) -> Result<()> {
    info!("Initializing wallet domain schemas (SurrealDB 3.1)...");

    let wallet_sql = r#"
        DEFINE TABLE IF NOT EXISTS wallet SCHEMAFULL
            COMMENT "Wallet balance snapshots (personal + corporation)";

        DEFINE FIELD IF NOT EXISTS id             ON TABLE wallet TYPE record<wallet>;
        DEFINE FIELD IF NOT EXISTS character      ON TABLE wallet TYPE record<character>;
        DEFINE FIELD IF NOT EXISTS balance        ON TABLE wallet TYPE decimal;
        DEFINE FIELD IF NOT EXISTS division       ON TABLE wallet TYPE option<int>;
        DEFINE FIELD IF NOT EXISTS last_synced_at ON TABLE wallet TYPE datetime;

        DEFINE INDEX IF NOT EXISTS idx_wallet_character ON TABLE wallet FIELDS character;
    "#;
    db.query(wallet_sql).await?.check()?;

    let journal_sql = r#"
        DEFINE TABLE IF NOT EXISTS wallet_journal SCHEMAFULL
            COMMENT "Wallet transaction journal entries";

        DEFINE FIELD IF NOT EXISTS id          ON TABLE wallet_journal TYPE record<wallet_journal>;
        DEFINE FIELD IF NOT EXISTS character   ON TABLE wallet_journal TYPE record<character>;
        DEFINE FIELD IF NOT EXISTS ref_id      ON TABLE wallet_journal TYPE int;
        DEFINE FIELD IF NOT EXISTS date        ON TABLE wallet_journal TYPE datetime;
        DEFINE FIELD IF NOT EXISTS ref_type    ON TABLE wallet_journal TYPE string;
        DEFINE FIELD IF NOT EXISTS amount      ON TABLE wallet_journal TYPE decimal;
        DEFINE FIELD IF NOT EXISTS balance     ON TABLE wallet_journal TYPE decimal;
        DEFINE FIELD IF NOT EXISTS description ON TABLE wallet_journal TYPE string;

        DEFINE INDEX IF NOT EXISTS idx_journal_character_date 
            ON TABLE wallet_journal FIELDS character, date;
        DEFINE INDEX IF NOT EXISTS idx_journal_ref_id 
            ON TABLE wallet_journal FIELDS character, ref_id UNIQUE;
    "#;
    db.query(journal_sql).await?.check()?;

    let orders_sql = r#"
        DEFINE TABLE IF NOT EXISTS market_order SCHEMAFULL
            COMMENT "Character and corporation market orders";

        DEFINE FIELD IF NOT EXISTS id            ON TABLE market_order TYPE record<market_order>;
        DEFINE FIELD IF NOT EXISTS character     ON TABLE market_order TYPE record<character>;
        DEFINE FIELD IF NOT EXISTS order_id      ON TABLE market_order TYPE int;
        DEFINE FIELD IF NOT EXISTS type_id       ON TABLE market_order TYPE int;
        DEFINE FIELD IF NOT EXISTS station_id    ON TABLE market_order TYPE option<int>;
        DEFINE FIELD IF NOT EXISTS volume_remain ON TABLE market_order TYPE int;
        DEFINE FIELD IF NOT EXISTS price         ON TABLE market_order TYPE decimal;
        DEFINE FIELD IF NOT EXISTS is_buy_order  ON TABLE market_order TYPE bool;
        DEFINE FIELD IF NOT EXISTS issued        ON TABLE market_order TYPE datetime;
        DEFINE FIELD IF NOT EXISTS expires       ON TABLE market_order TYPE datetime;

        DEFINE INDEX IF NOT EXISTS idx_order_character ON TABLE market_order FIELDS character;
        DEFINE INDEX IF NOT EXISTS idx_order_id        ON TABLE market_order FIELDS order_id UNIQUE;
    "#;
    db.query(orders_sql).await?.check()?;

    info!("Wallet domain schemas initialized successfully.");
    Ok(())
}
//! ESI Wallet / Journal models.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct GetCharactersCharacterIdWalletJournal200Ok {
    pub amount: Option<f64>,
    pub balance: Option<f64>,
    pub context_id: Option<i64>,
    pub context_id_type: Option<String>,
    pub date: String,
    pub description: String,
    pub first_party_id: Option<i32>,
    pub id: i64,
    pub reason: Option<String>,
    pub ref_type: String,
    pub second_party_id: Option<i32>,
    pub tax: Option<f64>,
    pub tax_receiver_id: Option<i32>,
}
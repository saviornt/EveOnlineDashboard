//! Market orders and history.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct GetMarketsRegionIdOrders200Ok {
    pub duration: i32,
    pub is_buy_order: bool,
    pub issued: String,
    pub location_id: i64,
    pub min_volume: i32,
    pub order_id: i64,
    pub price: f64,
    pub range: String,
    pub system_id: i32,
    pub type_id: i32,
    pub volume_remain: i32,
    pub volume_total: i32,
}
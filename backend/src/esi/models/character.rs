//! ESI Character models.
//! Source: https://developers.eveonline.com/api-explorer (Character section)

use serde::{Deserialize, Serialize};

/// GET /characters/{character_id}/
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct GetCharactersCharacterIdOk {
    pub alliance_id: Option<i32>,
    pub birthday: String,
    pub bloodline_id: i32,
    pub corporation_id: i32,
    pub description: Option<String>,
    pub faction_id: Option<i32>,
    pub gender: String,
    pub name: String,
    pub race_id: i32,
    pub security_status: Option<f64>,
    pub title: Option<String>,
}

/// GET /characters/{character_id}/skillqueue/
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct GetCharactersCharacterIdSkillqueue200Ok {
    pub finish_date: Option<String>,
    pub finished_level: i32,
    pub level_end_sp: Option<i32>,
    pub level_start_sp: Option<i32>,
    pub queue_position: i32,
    pub skill_id: i32,
    pub start_date: Option<String>,
    pub training_start_sp: Option<i32>,
}

/// GET /characters/{character_id}/skills/
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct GetCharactersCharacterIdSkillsOk {
    pub skills: Vec<CharacterSkill>,
    pub total_sp: i64,
    pub unallocated_sp: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct CharacterSkill {
    pub active_skill_level: i32,
    pub skill_id: i32,
    pub skillpoints_in_skill: i64,
    pub trained_skill_level: i32,
}
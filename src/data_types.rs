use queues::{IsQueue, Queue};
use rocket::serde::{self, uuid::Uuid};

#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(crate = "rocket::serde")]
pub struct Record {
  pub moniker: String,
  pub data: String,
}

#[derive(serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(untagged)]
#[serde(crate = "rocket::serde")]
pub enum SourceMissive {
  RecieveMissiveFrom { moniker: String, missive: String },
  RecieveRecordFrom { moniker: String, record: Record },
  VesselEntered { moniker: String },
  VesselLeft { moniker: String },
  ForcefulLeave(String),
  Unworthy(String),
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
#[serde(crate = "rocket::serde")]
pub struct SourceEntranceDetails {
  pub moniker: String,
  pub password: Uuid,
  pub other_vessels: Vec<String>,
}

pub struct Vessel {
  pub last_interaction: rocket::time::Instant,
  pub missives: Queue<SourceMissive>,
  pub password: Uuid,
}
impl Vessel {
  pub fn add_missive(&mut self, missive: SourceMissive) {
    self.missives.add(missive).unwrap();
  }
}

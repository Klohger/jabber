use std::{collections::HashMap, sync::Arc};

use queues::{IsQueue, Queue};
use rocket::{
  serde::{self, uuid::Uuid},
  tokio::sync::RwLock,
};

#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(crate = "rocket::serde")]
pub struct Record {
  pub file_name: String,
  pub data: String,
}

#[derive(serde::Serialize, Clone)]
#[serde(untagged)]
#[serde(crate = "rocket::serde")]
pub enum SourceMissive {
  RecieveMedia {
    #[serde(rename = "MONIKER")]
    moniker: String,
    #[serde(rename = "MEDIA")]
    media: Media,
  },
  VesselEntered {
    #[serde(rename = "MONIKER")]
    moniker: String,
  },
  VesselLeft {
    #[serde(rename = "MONIKER")]
    moniker: String,
  },
  ForcefulLeave(String),
  Unworthy(String),
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(tag = "TYPE")]
#[serde(crate = "rocket::serde")]
pub enum Media {
  Missive(String),
  Record(Record),
}

#[derive(serde::Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(crate = "rocket::serde")]
pub struct Invitation {
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
pub struct JoiningVessel {
  pub started_joining: rocket::time::Instant,
  pub password: Uuid,
}

pub type Vessels = Arc<CurrentVessels>;

#[derive(Default)]
pub struct CurrentVessels {
  pub active_vessels: RwLock<HashMap<String, Arc<RwLock<Vessel>>>>,
  pub joining_vessels: RwLock<HashMap<String, Arc<JoiningVessel>>>,
}

pub const TIME_OUT: rocket::time::Duration = rocket::time::Duration::hours(24);
pub const JOIN_TIME_OUT: rocket::time::Duration = rocket::time::Duration::seconds(60);
/*
pub struct EventStreamProtector<S>(EventStream<S>);

impl<'r, S: Stream<Item = Event> + Send + 'r> Responder<'r, 'r> for EventStreamProtector<S> {
  fn respond_to(self, request: &'r rocket::Request<'_>) -> rocket::response::Result<'r> {
    match self.0.respond_to(request) {
      Err(_) => todo!(),
      r => r,
    }
  }
}
macro_rules! EventStreamProtector {
      () => ($crate::_typed_stream!(EventStream, $crate::response::stream::Event));
      ($($s:tt)*) => ($crate::_typed_stream!(EventStream, $($s)*));
  }
*/

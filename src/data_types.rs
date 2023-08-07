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
#[serde(tag = "TYPE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(crate = "rocket::serde")]
pub enum InvitationRequestResponse {
  TooComplex,
  MonikerTaken,
  Invitation {
    #[serde(rename = "MONIKER")]
    moniker: String,
    #[serde(rename = "PASSWORD")]
    password: Uuid,
    #[serde(rename = "OTHER_VESSELS")]
    other_vessels: Vec<String>,
  }
}


pub enum 

#[derive(serde::Serialize, Clone)]
#[serde(tag = "TYPE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(crate = "rocket::serde")]
pub enum SourceMissive {
  InvitationRequestResponse{
    response : InvitationRequestResponse,
  },
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
    reason: LeaveReason,
  },
  InvalidCredentials
}
#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(crate = "rocket::serde")]
pub enum LeaveReason {
  SourceShutDown,
  AFK,
}
#[derive(serde::Deserialize, Clone)]
#[serde(tag = "TYPE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(crate = "rocket::serde")]
pub enum VesselMissive {
  RequestInvitation {
    #[serde(rename = "SUGGESTED_USERNAME")]
    suggested_username: String,
  },
  SendMedia {
    #[serde(rename = "RECIPIENT")]
    recipient: String,
    #[serde(rename = "MEDIA")]
    media: Media,
  },
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(tag = "TYPE")]
#[serde(crate = "rocket::serde")]
pub enum Media {
  Missive(String),
  Record(Record),
}
pub struct Vessel {
  pub last_interaction: rocket::time::Instant,
  pub password: Uuid,
}
pub struct JoiningVessel {
  pub started_joining: std::time::Instant,
  pub password: Uuid,
}

pub type Vessels = Arc<CurrentVessels>;

#[derive(Default)]
pub struct CurrentVessels {
  pub active_vessels: RwLock<HashMap<String, Arc<RwLock<Vessel>>>>,
  pub joining_vessels: RwLock<HashMap<String, JoiningVessel>>,
}

pub const TIME_OUT: rocket::time::Duration = rocket::time::Duration::hours(24);
pub const JOIN_TIME_OUT: std::time::Duration = std::time::Duration::from_secs(60);
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

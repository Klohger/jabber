use rocket::{
  serde::{self, uuid::Uuid},
  tokio::sync::{mpsc::Sender, RwLock},
};
use serde_with::{serde_as, Bytes};
use std::{collections::HashMap, sync::Arc};

#[serde_as]
#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(crate = "rocket::serde")]
pub struct Record {
  pub file_name: String,
  #[serde_as(as = "Bytes")]
  pub data: Vec<u8>,
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
  },
}

#[derive(serde::Serialize, Clone)]
#[serde(tag = "TYPE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(crate = "rocket::serde")]
pub enum SourceMissive {
  InvitationRequestResponse {
    #[serde(rename = "RESPONSE")]
    response: InvitationRequestResponse,
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
  Disconnect {
    reason: LeaveReason,
  },
}
#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(crate = "rocket::serde")]
pub enum LeaveReason {
  InvalidCredentials,
  SourceShutDown,
  VesselDisconnected,
  TimedOut,
}
#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(tag = "TYPE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(crate = "rocket::serde")]
pub enum VesselMissive {
  RequestInvitation {
    #[serde(rename = "SUGGESTED_MONIKER")]
    suggested_moniker: String,
  },
  SendMedia {
    #[serde(rename = "MONIKER")]
    moniker: String,
    #[serde(rename = "PASSWORD")]
    password: Uuid,
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
  Missive {
    #[serde(rename = "TEXT")]
    text: String,
  },
  Record(Record),
}
pub struct Vessel {
  pub last_interaction: RwLock<rocket::time::Instant>,
  pub message_sender: Arc<Sender<SourceMissive>>,
  pub password: Uuid,
}

pub type Vessels = Arc<RwLock<HashMap<String, Vessel>>>;

pub const TIME_OUT: rocket::time::Duration = rocket::time::Duration::hours(12);
pub const TIME_OUT_CHECKER_INTERVAL: rocket::tokio::time::Duration = rocket::tokio::time::Duration::from_secs(TIME_OUT.whole_seconds() as u64 * 2);

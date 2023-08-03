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

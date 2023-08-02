#[macro_use]
extern crate rocket;
mod data_types;
use crate::data_types::Invitation;
use data_types::{SourceMissive, Vessel};
use queues::{IsQueue, Queue};
use rocket::{
  fs::NamedFile,
  response::{
    status,
    stream::{Event, EventStream},
  },
  serde::{json::Json, uuid::Uuid},
  tokio::{self, select, sync::RwLock},
  Shutdown, State,
};
use std::{collections::HashMap, sync::Arc};

const TIME_OUT: rocket::time::Duration = rocket::time::Duration::seconds(10);
type Vessels = Arc<CurrentVessels>;

#[derive(Default)]
struct CurrentVessels {
  active_vessels: RwLock<HashMap<String, Arc<RwLock<Vessel>>>>,
  joining_vessels: RwLock<HashMap<String, Arc<RwLock<Vessel>>>>,
}

#[get("/")]
async fn index() -> NamedFile {
  NamedFile::open("static/index.html").await.unwrap()
}

#[get("/BACKGROUND")]
async fn background() -> NamedFile {
  NamedFile::open("static/wacky-lil-background.gif")
    .await
    .unwrap()
}

#[get("/COMPUTER_ICON")]
async fn computer_icon() -> NamedFile {
  NamedFile::open("static/compoter.gif").await.unwrap()
}

#[get("/THE_CODE")]
async fn the_code() -> NamedFile {
  NamedFile::open("static/swag.js").await.unwrap()
}

#[get("/REQUEST_INVITATION/<moniker_suggestion>")]
async fn request_invitation(
  moniker_suggestion: String,
  vessels: &State<Vessels>,
) -> Result<status::Accepted<Json<Invitation>>, status::Unauthorized<&'static str>> {
  let moniker_suggestion = moniker_suggestion.trim().to_owned();
  if moniker_suggestion.to_lowercase() == "klohger"
    || vessels
      .active_vessels
      .read()
      .await
      .contains_key(&moniker_suggestion)
  {
    Err(status::Unauthorized(Some(
      "...but THE SOURCE did not respond. Maybe someone wielding your moniker has already entered?",
    )))
  } else {
    let moniker = moniker_suggestion;
    let password = Uuid::new_v4();
    let mut joining_vessels = vessels.joining_vessels.write().await;
    joining_vessels.insert(
      moniker.clone(),
      Arc::new(RwLock::new(Vessel {
        last_interaction: rocket::time::Instant::now(),
        missives: Queue::new(),
        password,
      })),
    );
    Ok(status::Accepted(Some(Json(Invitation {
      moniker,
      password,
      other_vessels: vessels
        .active_vessels
        .read()
        .await
        .keys()
        .map(|moniker| moniker.clone())
        .collect(),
    }))))
  }
}

#[get("/ENTER/<moniker>/<password>")]
fn enter<'a>(
  mut shutdown: Shutdown,
  moniker: String,
  password: Uuid,
  vessels: &'a State<Vessels>,
) -> EventStream![Event + 'a] {
  async fn notify_vessel_entered(vessel: Arc<RwLock<Vessel>>, moniker: String) {
    vessel
      .write()
      .await
      .add_missive(SourceMissive::VesselEntered { moniker });
  }
  async fn notify_vessel_left(vessel: Arc<RwLock<Vessel>>, moniker: String) {
    vessel
      .write()
      .await
      .add_missive(SourceMissive::VesselLeft { moniker });
  }
  EventStream! {
    if vessels.joining_vessels.read().await.contains_key(&moniker)
    && vessels.joining_vessels.read().await.get(&moniker).unwrap().read().await.password == password
    {

      for handle in vessels
        .active_vessels
        .read()
        .await
        .values()
        .zip([moniker.clone()].iter().cycle())
        .map(|(vessel, moniker)| tokio::spawn(notify_vessel_entered(vessel.clone(), moniker.clone())))
      {
        handle.await.unwrap();
      }
      let vessel = vessels
        .joining_vessels
        .write()
        .await
        .remove(&moniker)
        .unwrap();
      vessels
        .active_vessels
        .write()
        .await
        .insert(moniker.clone(), vessel);
      let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(1));
      loop {
        select! {
          _ = interval.tick() => {
            println!("doing the swag with {}", moniker);
            if rocket::time::Instant::now() - vessels.active_vessels.read().await.get(&moniker).unwrap().read().await.last_interaction >= TIME_OUT {
              yield Event::json(&SourceMissive::ForcefulLeave("THE SOURCE found you of little substance, and has thus you've been forcefully exited from It. (Away From Keyboard)".to_owned())).event("ForcefulLeave");
              vessels.active_vessels.write().await.remove_entry(&moniker).unwrap();
              for handle in vessels
                .active_vessels
                .read()
                .await
                .values()
                .zip([moniker.clone()].iter().cycle())
                .map(|(vessel, moniker)| tokio::spawn(notify_vessel_left(vessel.clone(), moniker.clone())))
              {
                handle.await.unwrap();
              }
              break;
            }
            if let Some(moniker) = vessels.active_vessels.read().await.get(&moniker) {
              if let Ok(missive) = moniker.write().await.missives.remove() {
                match missive {
                  SourceMissive::RecieveMissiveFrom { moniker: _, missive: _ } => yield Event::json(&missive).event("RecieveMissive"),
                  SourceMissive::RecieveRecordFrom { moniker: _, record: _ } => yield Event::json(&missive).event("RecieveRecord"),
                  SourceMissive::VesselEntered { moniker: _ } => yield Event::json(&missive).event("VesselEntered"),
                  SourceMissive::VesselLeft { moniker: _ } => yield Event::json(&missive).event("VesselLeft"),
                  _ => (),
                }
              }
            }
          },
          _ = &mut shutdown => {
            println!("wowie");
            yield Event::json(&SourceMissive::ForcefulLeave("THE SOURCE is evaporating, leaving only you. (Server Shutdown)".to_owned())).event("ForcefulLeave");
            break;
          }
        }
      }

    } else {
      yield Event::json(&SourceMissive::Unworthy("...but THE SOURCE did not respond. Perhaps it did not see you worthy. (Invalid Credentials)".to_owned()))
        .event("Unworthy");
    }

  }
}

#[get("/SEND_MISSIVE/<moniker>/<password>/<other>/<missive>")]
async fn send_missive(
  moniker: String,
  password: Uuid,
  other: String,
  missive: String,
  vessels: &State<Vessels>,
) -> Result<status::Accepted<()>, status::Unauthorized<&'static str>> {
  let vessel = match vessels.active_vessels.read().await.get(&moniker) {
    Some(vessel) => vessel.clone(),
    None => {
      return Err(status::Unauthorized(Some(
        "...but THE SOURCE did not recognize you.",
      )))
    }
  };

  if vessel.read().await.password != password {
    return Err(status::Unauthorized(Some(
      "...but THE SOURCE did not recognize you.",
    )));
  }

  let other = match vessels.active_vessels.read().await.get(&other) {
    Some(other) => other.clone(),
    None => {
      return Err(status::Unauthorized(Some(
        "...but THE SOURCE could not find the recipient.",
      )))
    }
  };

  other
    .write()
    .await
    .add_missive(SourceMissive::RecieveMissiveFrom { moniker, missive });

  Ok(status::Accepted(Some(())))
}

#[launch]
fn rocket() -> _ {
  let root = routes![index, the_code];
  let media = routes![background, computer_icon];
  let the_source = routes![enter, request_invitation, send_missive];
  rocket::build()
    .manage(Vessels::default())
    .mount("/", root)
    .mount("/", media)
    .mount("/THE_SOURCE", the_source)
}

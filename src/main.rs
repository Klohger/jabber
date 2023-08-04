#[macro_use]
extern crate rocket;
mod data_types;
use crate::data_types::{Invitation, Vessels};
use data_types::{JoiningVessel, Media, Record, SourceMissive, Vessel};
use queues::{IsQueue, Queue};
use rocket::{
  fs::NamedFile,
  futures::{stream::SplitStream, SinkExt, StreamExt},
  response::{
    status,
    stream::{Event, EventStream},
  },
  serde::{json::Json, uuid::Uuid},
  tokio::{self, pin, select, sync::RwLock},
  Config, Ignite, Rocket, Shutdown, State,
};
use std::{collections::HashMap, sync::Arc};
use ws::stream::{DuplexStream, MessageStream};

#[get("/")]
async fn index() -> NamedFile {
  NamedFile::open("STATIC/SOURCE_CONNECTOR.HTML")
    .await
    .unwrap()
}
#[get("/CHASSI")]
async fn css() -> NamedFile {
  NamedFile::open("STATIC/SOURCE_CONNECTOR.CSS")
    .await
    .unwrap()
}

#[get("/STATUS/<i>")]
async fn status_icon(i: usize) -> NamedFile {
  NamedFile::open(format!("STATIC/STATUS/{i}.GIF"))
    .await
    .unwrap()
}

#[get("/SOURCE_CONNECTOR")]
async fn source_connector() -> NamedFile {
  NamedFile::open("static/swag.js").await.unwrap()
}

#[get("/THE_SOURCE/REQUEST_INVITATION/<moniker_suggestion>")]
async fn request_invitation(
  moniker_suggestion: String,
  vessels: &State<Vessels>,
) -> Result<status::Accepted<Json<Invitation>>, status::Unauthorized<&'static str>> {
  let moniker_suggestion = if moniker_suggestion.is_ascii() {
    moniker_suggestion.trim().to_ascii_uppercase().to_owned()
  } else {
    return Err(status::Unauthorized("...but the name was too complex."));
  };
  if moniker_suggestion == "KLOHGER"
    || vessels
      .active_vessels
      .read()
      .await
      .contains_key(&moniker_suggestion)
  {
    return Err(status::Unauthorized(
      "...but THE SOURCE did not respond. Maybe someone wielding your moniker has already entered?",
    ));
  };

  let moniker = moniker_suggestion;
  let password = Uuid::new_v4();
  let mut joining_vessels = vessels.joining_vessels.write().await;
  joining_vessels.insert(
    moniker.clone(),
    Arc::new(JoiningVessel {
      password,
      started_joining: rocket::time::Instant::now(),
    }),
  );
  Ok(status::Accepted(Json(Invitation {
    moniker,
    password,
    other_vessels: vessels
      .active_vessels
      .read()
      .await
      .keys()
      .map(|moniker| moniker.clone())
      .collect(),
  })))
}

#[get("/THE_SOURCE/ENTER/<moniker>/<password>")]
fn enter(
  ws: ws::WebSocket,
  mut shutdown: Shutdown,
  moniker: String,
  password: Uuid,
  vessels: &State<Vessels>,
) -> ws::Channel<'static> {
  /*
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
  let stream = EventStream! {
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
              yield Event::json(&SourceMissive::ForcefulLeave("THE SOURCE found you of little substance, and has thus you've been forcefully exited from It. (Away From Keyboard)".to_owned())).event("FORCEFUL_LEAVE");
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
                  SourceMissive::RecieveMedia { .. } => yield Event::json(&missive).event("RECIEVE_MEDIA"),
                  SourceMissive::VesselEntered { moniker: _ } => yield Event::json(&missive).event("VESSEL_ENTERED"),
                  SourceMissive::VesselLeft { moniker: _ } => yield Event::json(&missive).event("VESSEL_LEFT"),
                  _ => (),
                }
              }
            }
          },
          _ = &mut shutdown => {
            println!("wowie");
            yield Event::json(&SourceMissive::ForcefulLeave("THE SOURCE is evaporating, leaving only you. (Server Shutdown)".to_owned())).event("FORCEFUL_LEAVE");
            break;
          }
        }
      }

    } else {
      yield Event::json(&SourceMissive::Unworthy("...but THE SOURCE did not respond. Perhaps it did not see you worthy. (Invalid Credentials)".to_owned()))
        .event("Unworthy");
    }

    println!("wowie");
  };
  println!("wowie");
  ws.channel(move |mut stream| {
    Box::pin(async move {
      while let Some(message) = stream.next().await {
        let _ = stream.send(message?).await;
      }

      Ok(())
    })
  })
  */
  ws.channel(move |mut stream| {
    Box::pin(async move {
      let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(1));
      loop {
        select! {
          message = stream.next() => {
            if let Some(message) = message {
              match message {
                Ok(message) => println!("Recieved message: {message}"),
                Err(err) => println!("GOt an error: {err}"),
              }
            } else {
              println!("lost connection i guess");
              break;
            }
          },
          _ = interval.tick() => {

          },
          _ = &mut shutdown => {
            println!("wowie");
            break;
          }
        }
      }
      Ok(())
    })
  })
}

#[get("/THE_SOURCE/SEND/MISSIVE/<moniker>/<password>/<recipient>/<missive>")]
async fn send_missive(
  moniker: String,
  password: Uuid,
  recipient: String,
  missive: String,
  vessels: &State<Vessels>,
) -> Result<status::Accepted<()>, status::Unauthorized<&'static str>> {
  let vessel = match vessels.active_vessels.read().await.get(&moniker) {
    Some(vessel) => vessel.clone(),
    None => {
      return Err(status::Unauthorized(
        "...but THE SOURCE did not recognize you.",
      ))
    }
  };

  if vessel.read().await.password != password {
    return Err(status::Unauthorized(
      "...but THE SOURCE did not recognize you.",
    ));
  }

  let recipient = match vessels.active_vessels.read().await.get(&recipient) {
    Some(recipient) => recipient.clone(),
    None => {
      return Err(status::Unauthorized(
        "...but THE SOURCE could not find the recipient.",
      ))
    }
  };

  recipient
    .write()
    .await
    .add_missive(SourceMissive::RecieveMedia {
      moniker: moniker.clone(),
      media: Media::Missive(missive),
    });

  Ok(status::Accepted(()))
}

#[get("/THE_SOURCE/SEND/RECORD/<moniker>/<password>/<recipient>/<file_name>/<data>")]
async fn send_record(
  moniker: String,
  password: Uuid,
  recipient: String,
  file_name: String,
  data: String,
  vessels: &State<Vessels>,
) -> Result<status::Accepted<()>, status::Unauthorized<&'static str>> {
  let vessel = match vessels.active_vessels.read().await.get(&moniker) {
    Some(vessel) => vessel.clone(),
    None => {
      return Err(status::Unauthorized(
        "...but THE SOURCE did not recognize you.",
      ))
    }
  };

  if vessel.read().await.password != password {
    return Err(status::Unauthorized(
      "...but THE SOURCE did not recognize you.",
    ));
  }

  let recipient = match vessels.active_vessels.read().await.get(&recipient) {
    Some(recipient) => recipient.clone(),
    None => {
      return Err(status::Unauthorized(
        "...but THE SOURCE could not find the recipient.",
      ))
    }
  };

  recipient
    .write()
    .await
    .add_missive(SourceMissive::RecieveMedia {
      moniker: moniker.clone(),
      media: Media::Record(Record { file_name, data }),
    });

  Ok(status::Accepted(()))
}

#[rocket::main]
async fn main() -> Result<(), rocket::Error> {
  let vessels = Vessels::default();
  let mut interval = rocket::tokio::time::interval(rocket::tokio::time::Duration::from_secs(5));
  let rocket = rocket::build()
    .manage(vessels.clone())
    .mount(
      "/",
      routes![
        index,
        css,
        source_connector,
        status_icon,
        enter,
        request_invitation,
        send_record,
        send_missive
      ],
    )
    .launch();
  pin!(rocket);

  loop {
    select! {
      _ = interval.tick() => {
        println!("YOOO")
      },
      rocket = &mut rocket => {
        rocket?;
        break;
      }
    }
  }

  Ok(())
}

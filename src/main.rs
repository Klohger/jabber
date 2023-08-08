#[macro_use]
extern crate rocket;
mod data_types;

use data_types::{InvitationRequestResponse, SourceMissive, Vessels, TIME_OUT_CHECKER_INTERVAL};
use rocket::{
  fs::NamedFile,
  futures::{SinkExt, StreamExt},
  serde::uuid::Uuid,
  tokio::{
    self, select,
    sync::{mpsc::channel, RwLock},
  },
  Shutdown, State,
};
use std::sync::Arc;
use ws::Message;

use crate::data_types::{LeaveReason, Vessel, VesselMissive, TIME_OUT};

#[get("/")]
async fn index() -> NamedFile {
  NamedFile::open("STATIC/SOURCE_CONNECTOR.HTML").await.unwrap()
}
#[get("/CHASSI")]
async fn css() -> NamedFile {
  NamedFile::open("STATIC/SOURCE_CONNECTOR.CSS").await.unwrap()
}

#[get("/STATUS/<i>")]
async fn status_icon(i: usize) -> NamedFile {
  NamedFile::open(format!("STATIC/STATUS/{i}.GIF")).await.unwrap()
}

#[get("/SOURCE_CONNECTOR")]
async fn source_connector() -> NamedFile {
  NamedFile::open("static/swag.js").await.unwrap()
}

#[get("/THE_SOURCE")]
fn the_source<'a>(ws: ws::WebSocket, mut shutdown: Shutdown, vessels: &'a State<Vessels>) -> ws::Channel<'a> {
  ws.channel(move |mut stream| {
    Box::pin(async move {
      let mut vessel: Option<(String, Uuid)> = None;
      let (sender, mut reciever) = channel(1);
      let sender = Arc::new(sender);
      let mut interval = tokio::time::interval(TIME_OUT_CHECKER_INTERVAL);
      loop {
        select! {
          message = stream.next() => {
            if let Some(message) = message {
              match message {
                Ok(message) => {
                  if let Some(vessel) = vessel.as_mut() {
                    *vessels.read().await.get(&vessel.0.clone()).unwrap().last_interaction.write().await = rocket::time::Instant::now();
                  }
                  match message {
                    Message::Text(text) => {
                      println!("GOT TEXT {text}");
                      match rocket::serde::json::from_str::<VesselMissive>(&text).unwrap() {
                        VesselMissive::RequestInvitation { suggested_moniker } => {
                          if suggested_moniker.is_ascii() {
                            let suggested_moniker = suggested_moniker.to_ascii_uppercase().trim().to_owned();

                            if suggested_moniker == "KLOHGER" || vessels.read().await.contains_key(&suggested_moniker) {
                              stream.send(
                                ws::Message::Text(
                                  rocket::serde::json::to_string(
                                    &SourceMissive::InvitationRequestResponse { response: InvitationRequestResponse::MonikerTaken })
                                  .unwrap()))
                                .await.unwrap();

                              /*
                              return Err(status::Unauthorized(
                                "...but THE SOURCE did not respond. Maybe someone wielding your moniker has already entered?",
                              ));
                              */
                            } else {
                              vessel = Some((suggested_moniker, Uuid::new_v4()));
                              let mut vessels = vessels.write().await;
                              for v in vessels.values() {
                                v.message_sender.send(SourceMissive::VesselEntered { moniker: vessel.as_mut().unwrap().0.clone() }).await.unwrap();
                              }
                              vessels.insert(
                                vessel.as_mut().unwrap().0.clone(),
                                Vessel { last_interaction: RwLock::new(rocket::time::Instant::now()), message_sender: sender.clone(), password: vessel.as_mut().unwrap().1 }
                              );
                              stream.send(
                                ws::Message::Text(
                                  rocket::serde::json::to_string(
                                    &SourceMissive::InvitationRequestResponse {
                                      response: InvitationRequestResponse::Invitation {
                                        moniker : vessel.as_mut().unwrap().0.clone(),
                                        password : vessel.as_mut().unwrap().1,
                                        other_vessels:
                                        vessels
                                        .keys()
                                        .map(|moniker| moniker.clone()).collect() } })
                                  .unwrap()))
                                .await.unwrap();
                            }


                          } else {
                            stream.send(
                              ws::Message::Text(
                                rocket::serde::json::to_string(
                                  &SourceMissive::InvitationRequestResponse { response: InvitationRequestResponse::TooComplex })
                                .unwrap()))
                              .await.unwrap();
                            //return Err(status::Unauthorized("...but the name was too complex."));
                          }
                        },
                        VesselMissive::SendMedia { moniker, password, recipient, media } => {
                          let vessel = vessel.as_mut();
                          if let Some(vessel) = vessel {
                            if vessel.0 == moniker && vessel.1 == password {
                              let vessels =vessels.read().await;
                              let recipient = vessels.get(&recipient).unwrap();
                              recipient.message_sender.send(SourceMissive::RecieveMedia { moniker: vessel.0.clone(), media }).await.unwrap();
                              *recipient.last_interaction.write().await = rocket::time::Instant::now();
                            } else {
                              stream.send(Message::Text(rocket::serde::json::to_string(&SourceMissive::Disconnect { reason: LeaveReason::InvalidCredentials }).unwrap())).await.unwrap();
                            }
                          } else {
                            stream.send(Message::Text(rocket::serde::json::to_string(&SourceMissive::Disconnect { reason: LeaveReason::InvalidCredentials }).unwrap())).await.unwrap();
                          }
                        }
                      }
                    },
                    Message::Close(_) => {
                      if let Some(vessel) = vessel.as_mut() {
                        let mut vessels = vessels.write().await;
                        vessels.remove(&vessel.0.clone());
                        for v in vessels.values() {
                          v.message_sender.send(SourceMissive::VesselLeft { moniker: vessel.0.clone(), reason: LeaveReason::VesselDisconnected }).await.unwrap();
                        }
                      }
                      break;
                    },
                    Message::Binary(_) => todo!(),
                    Message::Ping(data) => stream.send(Message::Pong(data)).await.unwrap(),
                    Message::Pong(_) => todo!(),
                    Message::Frame(_) => todo!(),
                  }
                },
                Err(err) => println!("GOt an error: {err}"),
              }
            }
          },
          message = reciever.recv() => {
            if let Some(message) = message {
              stream.send(Message::Text(rocket::serde::json::to_string(&message).unwrap())).await.unwrap();
            }
          }
          _ = interval.tick() => {
            if let Some(vessel) = vessel.as_mut() {
              if (rocket::time::Instant::now() - *vessels.read().await.get(&vessel.0).unwrap().last_interaction.read().await) > TIME_OUT {
                stream.send(Message::Text(rocket::serde::json::to_string(&SourceMissive::Disconnect { reason: LeaveReason::TimedOut }).unwrap())).await.unwrap();
                let mut vessels = vessels.write().await;
                vessels.remove(&vessel.0.clone());
                for v in vessels.values() {
                  v.message_sender.send(SourceMissive::VesselLeft { moniker: vessel.0.clone(), reason: LeaveReason::TimedOut }).await.unwrap();
                }
                break;
              }
            }
          },
          _ = &mut shutdown => {
            stream.send(Message::Text(rocket::serde::json::to_string(&SourceMissive::Disconnect { reason: LeaveReason::SourceShutDown }).unwrap())).await.unwrap();
            break;
          }
        }
      }
      Ok(())
    })
  })
}

#[rocket::launch]
async fn launch() -> _ {
  rocket::build().manage(Vessels::default()).mount("/", routes![index, css, source_connector, status_icon, the_source])
}

#[macro_use]
extern crate rocket;
mod dataTypes;
use dataTypes::ServerMessage;

use queues::{IsQueue, Queue};
use rocket::{
  fs::NamedFile,
  futures::Stream,
  response::stream::{Event, EventStream, TextStream},
  serde::json::Json,
  tokio::sync::RwLock,
  tokio::time::{self, Duration},
  State,
};
use std::{collections::HashMap, sync::Arc};

struct User {
  last_interaction: time::Instant,
  messages: Queue<ServerMessage>,
}

type Users = Arc<RwLock<HashMap<String, User>>>;
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
#[get("/REQUEST_INVITATION/<username>")]
async fn request_invitation(username: String, users: &State<Users>) -> Json<ServerMessage> {
  let username = username.trim().to_lowercase();

  Json(
    if username.to_lowercase() == "klohger" && users.read().await.contains_key(&username) {
      ServerMessage::InvitationRequestDenied
    } else {
      users.write().await.values_mut().for_each(|u| {
        u.messages
          .add(ServerMessage::UserConnected {
            user: username.clone(),
          })
          .unwrap();
      });
      ServerMessage::InvitationRequestAccepted {
        other_users: users.read().await.keys().map(|s| s.clone()).collect(),
      }
    },
  )
}
#[get("/THE_SOURCE/<me>")]
fn the_source<'a>(me: String, users: &'a State<Users>) -> EventStream![Event + 'a] {
  EventStream! {
    if users.read().await.contains_key(&me) {
      let mut interval = time::interval(Duration::from_secs(1));
      loop {
        if let Some(me) = users.write().await.get_mut(&me) {
          if let Ok(message) = me.messages.remove() {
            yield Event::json(&message);
            interval.tick().await;
          }
        }
        break;
        
      }
    }
  }
}
#[launch]
fn rocket() -> _ {
  rocket::build()
    .manage(Users::default())
    .mount("/THE_SOURCE", routes![request_invitation])
    .mount("/", routes![index, background, computer_icon, the_source])
}

/*
use std::{
  collections::HashMap,
  convert::Infallible,
  result::Result,
  sync::{atomic::AtomicBool, Arc},
};

use futures_util::{FutureExt, StreamExt, SinkExt};
use tokio::sync::{
  mpsc::{unbounded_channel, UnboundedSender},
  RwLock,
};
use tokio_stream::wrappers::UnboundedReceiverStream;
use warp::{
  ws::{Message, WebSocket},
  Filter,
};

type Users = Arc<RwLock<HashMap<String, UnboundedSender<Result<Message, warp::Error>>>>>;

fn with_users(users: Users) -> impl Filter<Extract = (Users,), Error = Infallible> + Clone {
  warp::any().map(move || users.clone())
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
  let users = Users::default();

  let main_page = warp::path::end()
    .and(warp::get())
    .and(warp::fs::file("index.html"));

  let invitation_request = warp::path::end()
    .and(warp::ws())
    .and(with_users(users.clone()))
    .map(|ws: warp::ws::Ws, users| ws.on_upgrade(move |socket| bruh(socket, users)))
    .with(warp::cors().allow_any_origin());
  let background = warp::path("BACKGROUND")
    .and(warp::get())
    .and(warp::fs::file("wacky-lil-background.gif"));
  let user_icon = warp::path("USER-ICON")
    .and(warp::get())
    .and(warp::fs::file("compoter.gif"));

  let the_code = warp::path("THE_CODE")
    .and(warp::get())
    .and(warp::fs::file("swag.js"));

  let routes = background
    .or(user_icon)
    .or(the_code)
    .or(invitation_request)
    .or(main_page);

  warp::serve(routes).run(([127, 0, 0, 1], 3030)).await;
}
async fn bruh(socket: WebSocket, users: Users) {
  let should_exit: AtomicBool = false.into();

  let (mut ws_sender, mut ws_rcv) = socket.split();
  let (sender, rcv) = unbounded_channel();
  let rcv = UnboundedReceiverStream::new(rcv);
  let mut username: Option<String> = None;

  ws_sender.send(Message::text("YOO")).await.unwrap();

  let users2 = users.clone();
  let username2 = username.clone();

  tokio::task::spawn(rcv.forward(ws_sender).map(move |result| {
    if let Err(e) = result {
      eprintln!("error sending websocket msg: {e}");
      if let Some(username) = username2 {
        if users2.blocking_read().contains_key(&username) {
          let mut guarded_users = users2.blocking_write();
          guarded_users.remove(&username);
          guarded_users.iter().for_each(|user| {
            user
              .1
              .send(Ok(Message::text(
                serde_json::to_string(&ServerMessage::UserDisconnected {
                  user: username.clone(),
                })
                .unwrap(),
              )))
              .unwrap();
            println!(
              "Sent {} to {}!",
              stringify!(ServerMessage::UserDisconnected),
              user.0
            );
          })
        }
      }
    }
  }));

  while let Some(result) = ws_rcv.next().await {
    match result {
      Ok(msg) => {
        let message = serde_json::from_str::<ClientMessage>(
          msg.to_str().expect(
            format!(
              "Recieved a non JSON message from {}!",
              match &username {
                Some(username) => username,
                None => "an unresolved client",
              }
            )
            .as_str(),
          ),
        )
        .expect("failed to convert the thing FUCK");
        match message {
          ClientMessage::InvitationRequest {
            username: suggested_username,
          } => {
            let username_taken = suggested_username.to_lowercase() == "klohger"
              && users.read().await.contains_key(&suggested_username);

            if !username_taken {
              username = Some(suggested_username);

              sender
                .send(Ok(Message::text(
                  serde_json::to_string(&ServerMessage::InvitationRequestAccepted {
                    other_users: users.read().await.keys().map(|s| s.clone()).collect(),
                  })
                  .unwrap(),
                )))
                .expect(
                  format!(
                    "failed to send {} to {}!",
                    stringify!(ServerMessage::InvitationRequestAccepted),
                    match &username {
                      Some(username) => username,
                      None => "an unresolved client",
                    }
                  )
                  .as_str(),
                );

              println!(
                "Sent {} to {}!",
                stringify!(ServerMessage::InvitationRequestAccepted),
                match &username {
                  Some(username) => username,
                  None => "an unresolved client",
                }
              );

              let users_guard = users.write().await;

              users_guard.iter().for_each(|user| {
                user
                  .1
                  .send(Ok(Message::text(
                    serde_json::to_string(&ServerMessage::UserConnected {
                      user: username.clone().unwrap(),
                    })
                    .unwrap(),
                  )))
                  .expect(
                    format!(
                      "failed to send {} to {}!",
                      stringify!(ServerMessage::UserConnected),
                      user.0
                    )
                    .as_str(),
                  );
                println!(
                  "Sent {} to {}!",
                  stringify!(ServerMessage::UserConnected),
                  user.0
                );
              });
              users
                .write()
                .await
                .insert(username.clone().unwrap(), sender.clone());
            } else {
              sender
                .send(Ok(Message::text(
                  serde_json::to_string(&ServerMessage::InvitationRequestDenied).unwrap(),
                )))
                .expect(
                  format!(
                    "failed to send {} to {}!",
                    stringify!(ServerMessage::InvitationRequestDenied),
                    match &username {
                      Some(username) => username,
                      None => "an unresolved client",
                    }
                  )
                  .as_str(),
                );
              println!(
                "Sent {} to {}!",
                stringify!(ServerMessage::InvitationRequestDenied),
                match &username {
                  Some(username) => username,
                  None => "an unresolved client",
                }
              );
            }
          }
          ClientMessage::SendMessageTo { user, message } => {
            users
              .read()
              .await
              .get(&user)
              .unwrap()
              .send(Ok(Message::text(
                serde_json::to_string(&ServerMessage::RecieveMessageFrom {
                  user: username.clone().unwrap(),
                  message,
                })
                .unwrap(),
              )))
              .unwrap();
            println!(
              "Sent {} to {}!",
              stringify!(ServerMessage::RecieveMessageFrom),
              user
            );
          }
          ClientMessage::SendFileTo { user, file } => {
            users
              .write()
              .await
              .get_mut(&user)
              .unwrap()
              .send(Ok(Message::text(
                serde_json::to_string(&ServerMessage::RecieveFileFrom {
                  user: username.clone().unwrap(),
                  file,
                })
                .unwrap(),
              )))
              .unwrap();
            println!(
              "Sent {} to {}!",
              stringify!(ServerMessage::RecieveFileFrom),
              user
            );
          }
        }
      }
      Err(e) => eprintln!("error receiving message {}", e),
    };
    //client_msg(&uuid, msg, &clients).await;
  }
}
*/

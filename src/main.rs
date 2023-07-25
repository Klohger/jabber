use std::{collections::HashMap, convert::Infallible, result::Result, sync::Arc};

use futures_util::{FutureExt, StreamExt};
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

  let invitation_request = warp::ws()
    .and(with_users(users.clone()))
    .map(|ws: warp::ws::Ws, users| ws.on_upgrade(move |socket| bruh(socket, users)))
    .with(warp::cors().allow_any_origin());

  let routes = invitation_request.or(main_page);

  warp::serve(routes).run(([127, 0, 0, 1], 3030)).await;
}
async fn bruh(socket: WebSocket, users: Users) {
  let (ws_sender, mut ws_rcv) = socket.split();
  let (sender, rcv) = unbounded_channel();

  let rcv = UnboundedReceiverStream::new(rcv);
  let mut username: Option<String> = None;

  let users2 = users.clone();
  let username2 = username.clone();
  tokio::task::spawn(rcv.forward(ws_sender).map(move |result| {
    if let Err(e) = result {
      eprintln!("error sending websocket msg: {e}");
      if let Some(username) = username2 {
        if users2.blocking_read().contains_key(&username) {
          let mut guarded_users = users2.blocking_write();
          guarded_users.remove(&username);
          guarded_users.values().for_each(|user| {
            user
              .send(Ok(Message::text(
                serde_json::to_string(&ServerMessage::user_disconnected(username.clone())).unwrap(),
              )))
              .unwrap()
          })
        }
      }
    }
  }));

  while let Some(result) = ws_rcv.next().await {
    match result {
      Ok(msg) => {
        let message = serde_json::from_str::<ClientMessage>(msg.to_str().unwrap()).unwrap();
        match message._type {
          ClientMessageType::InvitationRequest => {
            let username_taken = users.read().await.contains_key(&message.user);

            sender
              .send(Ok(Message::text(
                serde_json::to_string(&ServerMessage::invitation_request(
                  !username_taken,
                  if username_taken {
                    None
                  } else {
                    Some(users.read().await.keys().map(|s| s.clone()).collect())
                  },
                ))
                .unwrap(),
              )))
              .unwrap();

            if !username_taken {
              username = Some(message.user);
              let users_guard = users.write().await;

              users_guard.values().for_each(|user| {
                user
                  .send(Ok(Message::text(
                    serde_json::to_string(&ServerMessage::user_connected(
                      username.clone().unwrap(),
                    ))
                    .unwrap(),
                  )))
                  .unwrap()
              });
              users
                .write()
                .await
                .insert(username.clone().unwrap(), sender.clone());
            }
          }
          ClientMessageType::SendMessageTo => users
            .read()
            .await
            .get(&message.user)
            .unwrap()
            .send(Ok(Message::text(
              serde_json::to_string(&ServerMessage::recieve_message_from(
                username.clone().unwrap(),
                message.message.unwrap(),
              ))
              .unwrap(),
            )))
            .unwrap(),
          ClientMessageType::SendFileTo => users
            .write()
            .await
            .get_mut(&message.user)
            .unwrap()
            .send(Ok(Message::text(
              serde_json::to_string(&ServerMessage::recieve_file_from(
                username.clone().unwrap(),
                message.file.unwrap(),
              ))
              .unwrap(),
            )))
            .unwrap(),
        }
      }
      Err(e) => eprintln!("error receiving message {}", e),
    };
    //client_msg(&uuid, msg, &clients).await;
  }
}

#[derive(serde::Deserialize, serde::Serialize)]
struct File {
  name: String,
  data: Vec<u8>,
}
#[derive(serde::Deserialize)]
enum ClientMessageType {
  InvitationRequest,
  SendMessageTo,
  SendFileTo,
}
#[derive(serde::Deserialize)]
struct ClientMessage {
  _type: ClientMessageType,
  user: String,
  message: Option<String>,
  file: Option<File>,
}

#[derive(serde::Serialize)]
enum TransferrableType {
  Message,
  File,
}

#[derive(serde::Serialize)]

enum ServerMessageType {
  InvitationResult,
  RecieveFrom,
  User,
}
#[derive(serde::Serialize)]
struct ServerMessage {
  _type: ServerMessageType,
  accepted: Option<bool>,
  other_users: Option<Vec<String>>,

  tranferrable_type: Option<TransferrableType>,
  message: Option<String>,
  file: Option<File>,

  user: Option<String>,

  connected: Option<bool>,
}
impl ServerMessage {
  fn invitation_request(accepted: bool, other_users: Option<Vec<String>>) -> Self {
    Self {
      _type: ServerMessageType::InvitationResult,
      accepted: Some(accepted),
      other_users: other_users,
      ..Default::default()
    }
  }
  fn accept_invitation_request(other_users: Vec<String>) -> Self {
    Self {
      _type: ServerMessageType::InvitationResult,
      accepted: Some(true),
      other_users: Some(other_users),
      ..Default::default()
    }
  }
  fn nah_fuck_you_man() -> Self {
    Self {
      _type: ServerMessageType::InvitationResult,
      accepted: Some(false),
      other_users: None,
      ..Default::default()
    }
  }
  fn recieve_message_from(user: String, message: String) -> Self {
    Self {
      _type: ServerMessageType::RecieveFrom,
      tranferrable_type: Some(TransferrableType::Message),
      message: Some(message),
      user: Some(user),
      ..Default::default()
    }
  }
  fn recieve_file_from(user: String, file: File) -> Self {
    Self {
      _type: ServerMessageType::RecieveFrom,
      tranferrable_type: Some(TransferrableType::File),
      file: Some(file),
      user: Some(user),
      ..Default::default()
    }
  }
  fn user_connected(user: String) -> Self {
    Self {
      _type: ServerMessageType::User,
      connected: Some(true),
      user: Some(user),
      ..Default::default()
    }
  }
  fn user_disconnected(user: String) -> Self {
    Self {
      _type: ServerMessageType::User,
      connected: Some(false),
      user: Some(user),
      ..Default::default()
    }
  }
}
impl Default for ServerMessage {
  fn default() -> Self {
    Self {
      _type: ServerMessageType::InvitationResult,
      accepted: Default::default(),
      other_users: Default::default(),
      tranferrable_type: Default::default(),
      message: Default::default(),
      file: Default::default(),
      user: Default::default(),
      connected: Default::default(),
    }
  }
}

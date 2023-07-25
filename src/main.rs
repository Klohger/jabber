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
  let mut username = None;
  tokio::task::spawn(rcv.forward(ws_sender).map(|result| {
    if let Err(e) = result {
      eprintln!("error sending websocket msg: {e}")
    }
  }));

  while let Some(result) = ws_rcv.next().await {
    match result {
      Ok(msg) => {
        let message = serde_json::from_str::<WSClientMessage>(msg.to_str().unwrap()).unwrap();
        match message._type {
          WSClientMessageType::InvitationRequest => {
            let username_taken = users.read().await.contains_key(&message.user);

            sender
              .send(Ok(Message::text(
                serde_json::to_string(&ServerMessage::InvitationResult {
                  accepted: !username_taken,
                  other_users: if username_taken {
                    None
                  } else {
                    Some(users.read().await.keys().map(|s| s.clone()).collect())
                  },
                })
                .unwrap(),
              )))
              .unwrap();

            if !username_taken {
              username = Some(message.user);
              users
                .write()
                .await
                .insert(username.clone().unwrap(), sender.clone());
            }
          }
          WSClientMessageType::SendMessageTo => users
            .write()
            .await
            .get_mut(&message.user)
            .unwrap()
            .send(Ok(Message::text(
              serde_json::to_string(&ServerMessage::RecieveFrom {
                user: username.clone().unwrap(),
                _type: TransferrableType::Message,
                message: message.message,
                file: None,
              })
              .unwrap(),
            )))
            .unwrap(),
          WSClientMessageType::SendFileTo => users
            .write()
            .await
            .get_mut(&message.user)
            .unwrap()
            .send(Ok(Message::text(
              serde_json::to_string(&ServerMessage::RecieveFrom {
                user: username.clone().unwrap(),
                _type: TransferrableType::File,
                message: None,
                file: message.file,
              })
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
enum WSClientMessageType {
  InvitationRequest,
  SendMessageTo,
  SendFileTo,
}
#[derive(serde::Deserialize)]
struct WSClientMessage {
  pub _type: WSClientMessageType,
  pub user: String,
  pub message: Option<String>,
  pub file: Option<File>,
}

#[derive(serde::Serialize)]
enum TransferrableType {
  Message,
  File,
}

#[derive(serde::Serialize)]
enum ServerMessage {
  InvitationResult {
    accepted: bool,
    other_users: Option<Vec<String>>,
  },
  RecieveFrom {
    user: String,
    _type: TransferrableType,
    message: Option<String>,
    file: Option<File>,
  },
}

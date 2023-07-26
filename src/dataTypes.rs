use rocket::serde;

#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(crate = "rocket::serde")]
pub struct File {
  pub name: String,
  pub data: String,
}

#[derive(serde::Deserialize)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
#[serde(crate = "rocket::serde")]
pub enum ClientMessage {
  #[serde(rename = "0")]
  InvitationRequest { me: String },
  #[serde(rename = "1")]
  SendMessageTo {
    me: String,
    other: String,
    message: String,
  },
  #[serde(rename = "2")]
  SendFileTo {
    me: String,
    other: String,
    file: File,
  },
}

#[derive(serde::Serialize, Clone)]
#[serde(tag = "type")]
#[serde(crate = "rocket::serde")]
pub enum ServerMessage {
  #[serde(rename = "0")]
  InvitationRequestDenied,
  #[serde(rename = "1")]
  InvitationRequestAccepted { other_users: Vec<String> },
  #[serde(rename = "2")]
  RecieveMessageFrom { user: String, message: String },
  #[serde(rename = "3")]
  RecieveFileFrom { user: String, file: File },
  #[serde(rename = "4")]
  UserConnected { user: String },
  #[serde(rename = "5")]
  UserDisconnected { user: String },
}

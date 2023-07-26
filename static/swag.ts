interface SwagFile {
  name: string;
  data: string;
}

namespace ServerMessage {
  export enum Type {
    InvitationRequestDenied = "0",
    InvitationRequestAccepted = "1",
    RecieveMessageFrom = "2",
    RecieveFileFrom = "3",
    UserConnected = "4",
    UserDisconnected = "5",
  }
  export interface InvitationRequestDenied {
    type: ServerMessage.Type.InvitationRequestDenied;
  }
  export interface InvitationRequestAccepted {
    type: ServerMessage.Type.InvitationRequestAccepted;
    other_users: string[];
  }
  export interface RecieveMessageFrom {
    type: ServerMessage.Type.RecieveMessageFrom;
    user: string;
    message: string;
  }
  export interface RecieveFileFrom {
    type: ServerMessage.Type.RecieveFileFrom;
    user: string;
    file: SwagFile;
  }
  export interface UserConnected {
    type: ServerMessage.Type.UserConnected;
    user: string;
  }
  export interface UserDisconnected {
    type: ServerMessage.Type.UserDisconnected;
    user: string;
  }
}
type ServerMessage =
  | ServerMessage.InvitationRequestAccepted
  | ServerMessage.InvitationRequestDenied
  | ServerMessage.RecieveMessageFrom
  | ServerMessage.RecieveFileFrom
  | ServerMessage.UserConnected
  | ServerMessage.UserDisconnected;
const THE_LIST = document.getElementById("THE_LIST") as HTMLUListElement;
let me: string;

let event_source: EventSource;

function OnSource(ev: MessageEvent<ServerMessage>) {
  let message = ev.data;
  console.log(message);
  switch (message.type) {
    case ServerMessage.Type.RecieveMessageFrom:
      alert(`Message from ${message.user}:\n${message.message}`);
      break;
    case ServerMessage.Type.RecieveFileFrom:
      alert(`Recieved file \"${message.user}\"`);
      break;
    case ServerMessage.Type.UserConnected:
      alert(`${message.user} connected.`);
      let div = document.createElement("div");
      div.id = message.user;
      let img = document.createElement("img");
      img.src = "USER_ICON";
      div.appendChild(img);
      THE_LIST.appendChild(CreateUserHTMLElement(message.user));
      break;
    case ServerMessage.Type.UserDisconnected:
      alert(`${message.user} disconnected.`);
      document.getElementById(message.user)?.remove();
  }
}

async function InvitationRequest(
  args: { deniedPreviously: boolean } = { deniedPreviously: false }
) {
  me = prompt(
    args.deniedPreviously
      ? "USERNAME ALREADY TAKEN. BETTER USERNAME. NOW."
      : "USERNAME. NOW."
  );

  await fetch(`REQUEST_INVITATION/${me}`).then(async (response) => {
    let message = (await response.json()) as ServerMessage;
    switch (message.type) {
      case ServerMessage.Type.InvitationRequestDenied:
        InvitationRequest({ deniedPreviously: true });
        break;
      case ServerMessage.Type.InvitationRequestAccepted:
        event_source = new EventSource(`THE_SOURCE/${me}`);
        event_source.onmessage = OnSource;
        alert(`Welcome!`);
        message.other_users.forEach((user) => {
          THE_LIST.appendChild(CreateUserHTMLElement(user));
        });
    }
  });
  /*
  
  */
}
function SendMessageTo(other: string, message: string) {}
function SendFileTo(other: string, file: SwagFile) {}

function CreateUserHTMLElement(user: string) {
  let div = document.createElement("div");
  div.id = user;
  let img = document.createElement("img");
  img.src = "USER_ICON";
  div.appendChild(img);
  div.innerText = user;
  return div;
}

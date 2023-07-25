type SwagFile = {
  name: String;
  data: ArrayBufferLike;
};

enum ClientMessageType {
  InvitationRequest,
  SendMessageTo,
  SendFileTo,
}

type ClientMessage = {
  _type: ClientMessageType;
  user: String;
  message: String | null;
  file: SwagFile | null;
};

enum TransferrableType {
  Message,
  File,
}
enum ServerMessageType {
  InvitationResult,
  RecieveFrom,
  User,
}
type ServerMessage = {
  _type: ServerMessageType;

  accepted: boolean | null;
  other_users: string[] | null;

  tranferrable_type?: TransferrableType;
  message?: string;
  file?: File;

  user?: string;

  connected?: boolean;
};

const ws = new WebSocket(`ws://${window.location.host}`);
ws.onopen = (_) => InvitationRequest("Gamer3");

function InvitationRequest(username: string) {
  ws.send(
    JSON.stringify({
      _type: ClientMessageType.InvitationRequest,
      user: username,
    })
  );
}
function SendMessageTo(user: string, message: String) {
  ws.send(
    JSON.stringify({ _type: ClientMessageType.SendMessageTo, user, message })
  );
}
function SendFileTo(user: string, file: SwagFile) {
  ws.send(JSON.stringify({ _type: ClientMessageType.SendFileTo, user, file }));
}

const users: Set<string> = new Set();

ws.onmessage = (ev: MessageEvent<ServerMessage>) => {
  const message = ev.data;
  switch (message._type) {
    case ServerMessageType.InvitationResult:
      if (message.accepted) {
        message.other_users.forEach((user) => users.add(user));
      }
      break;
    case ServerMessageType.RecieveFrom:
      switch (message.tranferrable_type) {
        case TransferrableType.Message:
          alert(`Message from ${message.user}:\n${message.message}`);
          break;
        case TransferrableType.File:
          alert(`Recieved file \"${message.user}\"`);
      }
      break;
    case ServerMessageType.User:
      if (message.connected) {
        alert(`${message.user} connected.`);
        users.add(message.user);
      } else {
        alert(`${message.user} disconnected.`);
        users.delete(message.user);
      }
  }
};

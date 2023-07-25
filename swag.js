var ClientMessageType;
(function (ClientMessageType) {
    ClientMessageType[ClientMessageType["InvitationRequest"] = 0] = "InvitationRequest";
    ClientMessageType[ClientMessageType["SendMessageTo"] = 1] = "SendMessageTo";
    ClientMessageType[ClientMessageType["SendFileTo"] = 2] = "SendFileTo";
})(ClientMessageType || (ClientMessageType = {}));
var TransferrableType;
(function (TransferrableType) {
    TransferrableType[TransferrableType["Message"] = 0] = "Message";
    TransferrableType[TransferrableType["File"] = 1] = "File";
})(TransferrableType || (TransferrableType = {}));
var ServerMessageType;
(function (ServerMessageType) {
    ServerMessageType[ServerMessageType["InvitationResult"] = 0] = "InvitationResult";
    ServerMessageType[ServerMessageType["RecieveFrom"] = 1] = "RecieveFrom";
    ServerMessageType[ServerMessageType["User"] = 2] = "User";
})(ServerMessageType || (ServerMessageType = {}));
const ws = new WebSocket(`ws://${window.location.host}`);
ws.onopen = (_) => InvitationRequest("Gamer3");
function InvitationRequest(username) {
    ws.send(JSON.stringify({
        _type: ClientMessageType.InvitationRequest,
        user: username,
    }));
}
function SendMessageTo(user, message) {
    ws.send(JSON.stringify({ _type: ClientMessageType.SendMessageTo, user, message }));
}
function SendFileTo(user, file) {
    ws.send(JSON.stringify({ _type: ClientMessageType.SendFileTo, user, file }));
}
const users = new Set();
ws.onmessage = (ev) => {
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
            }
            else {
                alert(`${message.user} disconnected.`);
                users.delete(message.user);
            }
    }
};
//# sourceMappingURL=swag.js.map
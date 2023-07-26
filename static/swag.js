var ClientMessage;
(function (ClientMessage) {
    let Type;
    (function (Type) {
        Type["InvitationRequest"] = "0";
        Type["SendMessageTo"] = "1";
        Type["SendFileTo"] = "2";
    })(Type = ClientMessage.Type || (ClientMessage.Type = {}));
})(ClientMessage || (ClientMessage = {}));
var ServerMessage;
(function (ServerMessage) {
    let Type;
    (function (Type) {
        Type["InvitationRequestDenied"] = "0";
        Type["InvitationRequestAccepted"] = "1";
        Type["RecieveMessageFrom"] = "2";
        Type["RecieveFileFrom"] = "3";
        Type["UserConnected"] = "4";
        Type["UserDisconnected"] = "5";
    })(Type = ServerMessage.Type || (ServerMessage.Type = {}));
})(ServerMessage || (ServerMessage = {}));
const THE_LIST = document.getElementById("THE_LIST");
const ws = new WebSocket(`ws://${window.location.host}`);
ws.onopen = (_) => InvitationRequest();
function InvitationRequest(args = { denivedPreviously: false }) {
    ws.send(JSON.stringify({
        type: ClientMessage.Type.InvitationRequest,
        user: prompt(args.denivedPreviously
            ? "USERNAME ALREADY TAKEN. BETTER USERNAME. NOW."
            : "USERNAME. NOW."),
    }));
}
function SendMessageTo(user, message) {
    ws.send(JSON.stringify({
        type: ClientMessage.Type.SendMessageTo,
        user,
        message,
    }));
}
function SendFileTo(user, file) {
    ws.send(JSON.stringify({
        type: ClientMessage.Type.SendFileTo,
        user,
        file,
    }));
}
function CreateUserHTMLElement(user) {
    let div = document.createElement("div");
    div.id = user;
    let img = document.createElement("img");
    img.src = "USER_ICON";
    div.appendChild(img);
    div.innerText = user;
    return div;
}
ws.onmessage = (ev) => {
    let message = ev.data;
    switch (message.type) {
        case ServerMessage.Type.InvitationRequestDenied:
            InvitationRequest({ denivedPreviously: true });
            break;
        case ServerMessage.Type.InvitationRequestAccepted:
            alert(`Welcome!`);
            message.other_users.forEach((user) => {
                THE_LIST.appendChild(div);
            });
            break;
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
            document.getElementById(message.user).remove();
    }
};
//# sourceMappingURL=swag.js.map
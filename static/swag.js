"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var SOURCE_CONNECTOR;
(function (SOURCE_CONNECTOR) {
    let ServerMessage;
    (function (ServerMessage) {
        ServerMessage.events = [
            [
                "RecieveMissiveFrom",
                (ev) => {
                    const message = JSON.parse(ev.data);
                    console.log(ev.type, message);
                },
            ],
            [
                "RecieveRecordFrom",
                (ev) => {
                    const message = JSON.parse(ev.data);
                    console.log(ev.type, message);
                },
            ],
            [
                "VesselEntered",
                (ev) => {
                    const message = JSON.parse(ev.data);
                    THE_LIST.appendChild(CreateVesselHTMLElement(message.moniker));
                    console.log(ev.type, message);
                },
            ],
            [
                "VesselLeft",
                (ev) => {
                    const message = JSON.parse(ev.data);
                    document.querySelectorAll(`[vessel="${message.moniker}"]`).item(0)
                        .remove;
                    console.log(ev.type, message);
                },
            ],
            [
                "ForcefulLeave",
                (ev) => {
                    const message = JSON.parse(ev.data);
                    THE_LIST.innerHTML = "";
                    console.log(ev.type, message);
                    eventSource.close();
                },
            ],
            [
                "Unworthy",
                (ev) => {
                    const message = JSON.parse(ev.data);
                    console.log(ev.type, message);
                    eventSource.close();
                },
            ],
        ];
    })(ServerMessage || (ServerMessage = {}));
    let eventSource;
    const THE_LIST = document.getElementById("THE_LIST");
    function RequestInvitation(args) {
        return fetch(`THE_SOURCE/REQUEST_INVITATION/${args.moniker_suggestion}`).then((response) => __awaiter(this, void 0, void 0, function* () {
            switch (response.status) {
                case 202:
                    let details = (yield response.json());
                    return details;
            }
            throw yield response.text();
        }), (err) => {
            throw err;
        });
    }
    function RecieveInvitation() {
        return __awaiter(this, void 0, void 0, function* () {
            let details;
            {
                let error_message = null;
                let moniker_suggestion;
                let promise;
                do {
                    moniker_suggestion = prompt(error_message === null
                        ? "Choose a moniker to wield for THE SOURCE."
                        : error_message);
                    if (moniker_suggestion === null)
                        continue;
                    promise = RequestInvitation({ moniker_suggestion });
                } while (yield promise.then((res) => {
                    details = res;
                    return false;
                }, (err) => {
                    error_message = err;
                    return true;
                }));
            }
            return details;
        });
    }
    function EnterSource(vessel) {
        eventSource = new EventSource(`THE_SOURCE/ENTER/${vessel.moniker}/${vessel.password}`);
        eventSource.onopen = (_) => {
            console.log("entered THE SOURCE");
        };
        ServerMessage.events.forEach(([type, event]) => {
            console.log(type);
            eventSource.addEventListener(type, event);
        });
    }
    function SendMessageTo(other, message) { }
    function SendRecordTo(other, record) { }
    function ProcessInvitation(details) {
        details.otherVessels.forEach((v) => THE_LIST.appendChild(CreateVesselHTMLElement(v)));
        return Object.assign({}, details);
    }
    function CreateVesselHTMLElement(vessel) {
        let div = document.createElement("div");
        div.setAttribute("vessel", vessel);
        let img = document.createElement("img");
        img.src = "COMPUTER_ICON";
        img.style.height = "1rem";
        img.style.width = "1rem";
        div.appendChild(img);
        div.appendChild(document.createTextNode(vessel));
        return div;
    }
    (() => __awaiter(this, void 0, void 0, function* () { return EnterSource(ProcessInvitation(yield RecieveInvitation())); }))();
})(SOURCE_CONNECTOR || (SOURCE_CONNECTOR = {}));
//# sourceMappingURL=swag.js.map
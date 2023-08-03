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
    let SOURCE_MISSIVE;
    (function (SOURCE_MISSIVE) {
        SOURCE_MISSIVE.events = [
            [
                "RECIEVE_MEDIA",
                (EVENT) => {
                    const MISSIVE = JSON.parse(EVENT.data);
                    console.log(EVENT.type, MISSIVE);
                },
            ],
            [
                "VESSEL_ENTERED",
                (EVENT) => {
                    const MISSIVE = JSON.parse(EVENT.data);
                    THE_TABLE.appendChild(SHAPE_VESSEL_HTML_ELEMENT(MISSIVE.MONIKER));
                    console.log(EVENT.type, MISSIVE);
                },
            ],
            [
                "VESSEL_LEFT",
                (EVENT) => {
                    var _a;
                    const MISSIVE = JSON.parse(EVENT.data);
                    (_a = document.getElementById(MISSIVE.MONIKER)) === null || _a === void 0 ? void 0 : _a.remove();
                    console.log(EVENT.type, MISSIVE);
                },
            ],
            [
                "FORCEFUL_LEAVE",
                (EVENT) => {
                    const MISSIVE = JSON.parse(EVENT.data);
                    THE_TABLE.innerHTML = "";
                    console.log(EVENT.type, MISSIVE);
                    THE_SOURCE_CONNECTION.close();
                },
            ],
            [
                "UNWORTHY",
                (EVENT) => {
                    const MISSIVE = JSON.parse(EVENT.data);
                    console.log(EVENT.type, MISSIVE);
                    THE_SOURCE_CONNECTION.close();
                },
            ],
        ];
    })(SOURCE_MISSIVE || (SOURCE_MISSIVE = {}));
    let THE_SOURCE_CONNECTION;
    const CONNECT_BUTTON = document.getElementById("CONNECT_BUTTON");
    const THE_TABLE = document.getElementById("THE_TABLE");
    let THE_SELF;
    function RECIEVE_INVITATION() {
        return __awaiter(this, void 0, void 0, function* () {
            let DETAILS;
            {
                let ERROR_MESSAGE = null;
                let MONIKER_SUGGESTION;
                let PROMISE;
                do {
                    MONIKER_SUGGESTION = prompt(ERROR_MESSAGE === null
                        ? "Choose a MONIKER to wield for THE SOURCE."
                        : ERROR_MESSAGE);
                    if (MONIKER_SUGGESTION === null)
                        continue;
                    PROMISE = REQUEST_INVITATION({
                        MONIKER_SUGGESTION: MONIKER_SUGGESTION,
                    });
                } while (yield PROMISE.then((RES) => {
                    DETAILS = RES;
                    return false;
                }, (ERR) => {
                    ERROR_MESSAGE = ERR;
                    return true;
                }));
            }
            return DETAILS;
        });
    }
    function CONNECT_TO_SOURCE() {
        let THE_SOURCE = new EventSource(`THE_SOURCE/ENTER/${THE_SELF.MONIKER}/${THE_SELF.PASSWORD}`);
        THE_SOURCE.onopen = (_) => {
            console.log("entered THE SOURCE");
        };
        SOURCE_MISSIVE.events.forEach(([type, event]) => {
            console.log(type);
            THE_SOURCE.addEventListener(type, event);
        });
        return THE_SOURCE;
    }
    function REQUEST_INVITATION(args) {
        return fetch(`THE_SOURCE/REQUEST_INVITATION/${args.MONIKER_SUGGESTION}`).then((response) => __awaiter(this, void 0, void 0, function* () {
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
    function SEND_MISSIVE_TO(RECIPIENT, MISSIVE) {
        return fetch(`THE_SOURCE/SEND/MISSIVE/${THE_SELF.MONIKER}/${THE_SELF.PASSWORD}/${RECIPIENT}/${MISSIVE}`).then((response) => __awaiter(this, void 0, void 0, function* () {
            switch (response.status) {
                case 202:
                    return;
            }
            throw yield response.text();
        }), (err) => {
            throw err;
        });
    }
    function SEND_RECORD_TO(RECIPIENT, RECORD) {
        return fetch(`THE_SOURCE/SEND/MISSIVE/${THE_SELF.MONIKER}/${THE_SELF.PASSWORD}/${RECIPIENT}/${RECORD.FILENAME}/${RECORD.DATA}`).then((RESPONSE) => __awaiter(this, void 0, void 0, function* () {
            switch (RESPONSE.status) {
                case 202:
                    return;
            }
            throw yield RESPONSE.text();
        }), (ERR) => {
            throw ERR;
        });
    }
    function PROCESS_INVITATION(DETAILS) {
        DETAILS.OTHER_VESSELS.forEach((v) => THE_TABLE.appendChild(SHAPE_VESSEL_HTML_ELEMENT(v)));
        return { MONIKER: DETAILS.MONIKER, PASSWORD: DETAILS.PASSWORD };
    }
    function SHAPE_VESSEL_HTML_ELEMENT(VESSEL) {
        var _a;
        let table = document.createElement("table");
        table.innerHTML = `
    <tbody>
      <tr id="${VESSEL}" style="padding: 0; margin: 0;">
        <td 
          class="STATUS" 
          style="
          border-top:0.25rem inset white; 
          border-left:0.25rem inset white;
          border-bottom:0.25rem inset white;
          padding: 0; margin: 0;"
        >
          <img 
            style="margin: 0; padding: 0; border:white outset 0.25rem;"
            src="COMPUTER_ICON"
          >
        </td>
        <td class="NAME" style="
        border-bottom:0.25rem inset white;
        border-top:0.25rem inset white; padding: 0; margin: 0;">
          <p style="margin: 0; padding: 0; border:white outset 0.25rem;">${VESSEL}</p>
        </td>
        <td class="SEND_MISSIVE" style="
        border-bottom:0.25rem inset white; 
        border-top:0.25rem inset white; padding: 0; margin: 0;">
          <form style="border:white outset 0.25rem; padding: 0; margin: 0; ">
            <label for="${VESSEL}_MISSIVE_INPUT" style="padding: 0; margin: 0;">INPUT MISSIVE:
            </label>
            <input id="${VESSEL}_MISSIVE_INPUT" type="text"
              style="border:white inset 0.25rem; padding: 0; padding-inline: 0; margin: 0;"><input type="submit"
              value="SUBMIT" style="border:white outset 0.25rem; padding: 0; padding-inline: 0; margin: 0;">
          </form>
        </td>
        <td class="SEND_RECORD" style="
        border-bottom:0.25rem inset white; 
        border-top:0.25rem inset white; border-right:0.25rem inset white; padding: 0; margin: 0;">
          <form style="border:white outset 0.25rem; padding: 0; margin: 0;">
            <label for="${VESSEL}_RECORD_INPUT" style="padding: 0; margin: 0;">INPUT RECORD:
            </label>
            <input id="${VESSEL}_RECORD_INPUT" type="file"
              style="border:white outset 0.25rem; padding: 0; margin: 0;"><input type="submit" value="SUBMIT">
          </form>
        </td>
      </tr>
    </tbody>`.trim();
        let vessel = (_a = table.firstElementChild) === null || _a === void 0 ? void 0 : _a.firstElementChild;
        return vessel;
    }
    CONNECT_BUTTON.addEventListener("click", (ev) => __awaiter(this, void 0, void 0, function* () {
        ev.preventDefault();
        THE_SELF = PROCESS_INVITATION(yield RECIEVE_INVITATION());
        THE_SOURCE_CONNECTION = CONNECT_TO_SOURCE();
        CONNECT_BUTTON.remove();
    }));
    CONNECT_BUTTON.addEventListener("mousedown", (ev) => {
        ev.preventDefault();
        CONNECT_BUTTON.style.border = "white inset 0.25rem";
    });
    CONNECT_BUTTON.addEventListener("mouseenter", (ev) => {
        ev.preventDefault();
        CONNECT_BUTTON.style.background = "lightgray";
    });
    CONNECT_BUTTON.addEventListener("mouseleave", (ev) => {
        ev.preventDefault();
        CONNECT_BUTTON.style.background = "rgb(230, 230, 230)";
    });
})(SOURCE_CONNECTOR || (SOURCE_CONNECTOR = {}));

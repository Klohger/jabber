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
                    THE_TABLE.innerHTML += SHAPE_VESSEL_HTML_ELEMENT(MISSIVE.MONIKER);
                    console.log(EVENT.type, MISSIVE);
                },
            ],
            [
                "VESSEL_LEFT",
                (EVENT) => {
                    const MISSIVE = JSON.parse(EVENT.data);
                    document.querySelectorAll(`[vessel="${MISSIVE.MONIKER}"]`).item(0)
                        .remove;
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
    SOURCE_CONNECTOR.SEND_MISSIVE_TO = SEND_MISSIVE_TO;
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
    SOURCE_CONNECTOR.SEND_RECORD_TO = SEND_RECORD_TO;
    function PROCESS_INVITATION(DETAILS) {
        DETAILS.OTHER_VESSELS.forEach((v) => (THE_TABLE.innerHTML += SHAPE_VESSEL_HTML_ELEMENT(v)));
        return { MONIKER: DETAILS.MONIKER, PASSWORD: DETAILS.PASSWORD };
    }
    function SHAPE_VESSEL_HTML_ELEMENT(VESSEL) {
        return `<tr id="${VESSEL}" style="padding: 0; margin: 0; border:white inset 0.5rem;">
  <td class="STATUS" style="padding: 0; margin: 0;"><img style="margin: 0; padding: 0; border:white outset 0.25rem;"
      src="COMPUTER_ICON"></td>
  <td class="NAME" style="padding: 0; margin: 0;">
    <p style="margin: 0; padding: 0; border:white outset 0.25rem;">${VESSEL}</p>
  </td>
  <td class="SEND_MISSIVE" style="padding: 0; margin: 0;">
    <form style="border:white outset 0.25rem; padding: 0; margin: 0; ">
      <label for="${VESSEL}_MISSIVE_INPUT" style="border:white outset 0.25rem; padding: 0; margin: 0;">INPUT MISSIVE:
      </label>
      <input id="${VESSEL}_MISSIVE_INPUT" type="text"
        style="border:white inset 0.25rem; padding: 0; padding-inline: 0; margin: 0;"><input type="submit"
        value="SUBMIT" style="border:white outset 0.25rem; padding: 0; padding-inline: 0; margin: 0;">
    </form>
  </td>
  <td class="SEND_RECORD" style="padding: 0; margin: 0;">
    <form style="border:white outset 0.25rem; padding: 0; margin: 0;">
      <label for="${VESSEL}_RECORD_INPUT" style="border:white outset 0.25rem; padding: 0; margin: 0;">INPUT RECORD:
      </label>
      <input id="${VESSEL}_RECORD_INPUT" type="file"
        style="border:white outset 0.25rem; padding: 0; margin: 0;"><input type="submit" value="SUBMIT"
        style="border:white outset 0.25rem; padding: 0; margin: 0;">
    </form>
  </td>
</tr>`;
    }
    function CONNECT() {
        return __awaiter(this, void 0, void 0, function* () {
            THE_SELF = PROCESS_INVITATION(yield RECIEVE_INVITATION());
            THE_SOURCE_CONNECTION = CONNECT_TO_SOURCE();
        });
    }
    SOURCE_CONNECTOR.CONNECT = CONNECT;
})(SOURCE_CONNECTOR || (SOURCE_CONNECTOR = {}));

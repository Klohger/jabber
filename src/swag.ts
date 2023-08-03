namespace SOURCE_CONNECTOR {
  namespace SOURCE_MISSIVE {
    export const events: [string, (EVENT: MessageEvent<string>) => void][] = [
      [
        "RECIEVE_MEDIA",
        (EVENT) => {
          const MISSIVE = JSON.parse(
            EVENT.data
          ) as SOURCE_MISSIVE.RECIEVE_MEDIA;
          console.log(EVENT.type, MISSIVE);
        },
      ],
      [
        "VESSEL_ENTERED",
        (EVENT) => {
          const MISSIVE = JSON.parse(
            EVENT.data
          ) as SOURCE_MISSIVE.VESSEL_ENTERED;
          THE_TABLE.appendChild(SHAPE_VESSEL_HTML_ELEMENT(MISSIVE.MONIKER));
          console.log(EVENT.type, MISSIVE);
        },
      ],
      [
        "VESSEL_LEFT",
        (EVENT) => {
          const MISSIVE = JSON.parse(EVENT.data) as SOURCE_MISSIVE.VESSEL_LEFT;
          document.getElementById(MISSIVE.MONIKER)?.remove();
          console.log(EVENT.type, MISSIVE);
        },
      ],
      [
        "FORCEFUL_LEAVE",
        (EVENT) => {
          const MISSIVE = JSON.parse(
            EVENT.data
          ) as SOURCE_MISSIVE.FORCEFUL_LEAVE;
          THE_TABLE.innerHTML = "";
          console.log(EVENT.type, MISSIVE);
          THE_SOURCE_CONNECTION.close();
          CONNECT_BUTTON.style.display = "block";

        },
      ],
      [
        "UNWORTHY",
        (EVENT) => {
          const MISSIVE = JSON.parse(EVENT.data) as SOURCE_MISSIVE.UNWORTHY;
          console.log(EVENT.type, MISSIVE);
          THE_SOURCE_CONNECTION.close();
        },
      ],
    ];
    export type RECIEVE_MEDIA = {
      MONIKER: string;
      MEDIA: MEDIA;
    };
    export type VESSEL_ENTERED = {
      MONIKER: string;
    };
    export type VESSEL_LEFT = {
      MONIKER: string;
    };
    export type FORCEFUL_LEAVE = string;
    export type UNWORTHY = string;
  }
  type SOURCE_MISSIVE =
    | SOURCE_MISSIVE.RECIEVE_MEDIA
    | SOURCE_MISSIVE.VESSEL_ENTERED
    | SOURCE_MISSIVE.VESSEL_LEFT
    | SOURCE_MISSIVE.FORCEFUL_LEAVE
    | SOURCE_MISSIVE.UNWORTHY;

  type VESSEL = {
    MONIKER: string;
    PASSWORD: string;
  };

  type INVITATION = VESSEL & {
    OTHER_VESSELS: string[];
  };
  type RECORD = {
    TYPE: "RECORD";
    FILENAME: string;
    DATA: string;
  };
  type MISSIVE = {
    TYPE: "MISSIVE";
    TEXT: String;
  };
  export type MEDIA = RECORD | MISSIVE;

  const enum STATUS {
    ACCEPTED = 202,
    UNAUTHORIZED = 401,
  }

  let THE_SOURCE_CONNECTION!: EventSource;
  const CONNECT_BUTTON = document.getElementById(
    "CONNECT_BUTTON"
  ) as HTMLButtonElement;
  const THE_TABLE = document.getElementById("THE_TABLE") as HTMLTableElement;
  let THE_SELF: VESSEL;
  async function RECIEVE_INVITATION() {
    let DETAILS!: INVITATION;
    {
      let ERROR_MESSAGE: null | string = null;
      let MONIKER_SUGGESTION: string | null;
      let PROMISE!: Promise<INVITATION>;
      do {
        MONIKER_SUGGESTION = prompt(
          ERROR_MESSAGE === null
            ? "Choose a MONIKER to wield for THE SOURCE."
            : ERROR_MESSAGE
        );
        if (MONIKER_SUGGESTION === null) continue;
        PROMISE = REQUEST_INVITATION({
          MONIKER_SUGGESTION: MONIKER_SUGGESTION,
        });
      } while (
        await PROMISE.then(
          (RES) => {
            DETAILS = RES;
            return false;
          },
          (ERR: string) => {
            ERROR_MESSAGE = ERR;
            return true;
          }
        )
      );
    }
    return DETAILS;
  }
  function CONNECT_TO_SOURCE() {
    let THE_SOURCE = new EventSource(
      `THE_SOURCE/ENTER/${THE_SELF.MONIKER}/${THE_SELF.PASSWORD}`
    );

    THE_SOURCE.onopen = (_) => {
      console.log("entered THE SOURCE");
    };
    SOURCE_MISSIVE.events.forEach(([type, event]) => {
      console.log(type);
      THE_SOURCE.addEventListener(type, event);
    });
    return THE_SOURCE;
  }
  function REQUEST_INVITATION(args: { MONIKER_SUGGESTION: string }) {
    return fetch(
      `THE_SOURCE/REQUEST_INVITATION/${args.MONIKER_SUGGESTION}`
    ).then(
      async (response) => {
        switch (response.status) {
          case STATUS.ACCEPTED:
            let details = (await response.json()) as INVITATION;
            return details;
        }
        throw await response.text();
      },
      (err) => {
        throw err;
      }
    );
  }
  function SEND_MISSIVE_TO(RECIPIENT: string, MISSIVE: string) {
    return fetch(
      `THE_SOURCE/SEND/MISSIVE/${THE_SELF.MONIKER}/${THE_SELF.PASSWORD}/${RECIPIENT}/${MISSIVE}`
    ).then(
      async (response) => {
        switch (response.status) {
          case STATUS.ACCEPTED:
            return;
        }
        throw await response.text();
      },
      (err) => {
        throw err;
      }
    );
  }
  function SEND_RECORD_TO(RECIPIENT: string, RECORD: RECORD) {
    return fetch(
      `THE_SOURCE/SEND/MISSIVE/${THE_SELF.MONIKER}/${THE_SELF.PASSWORD}/${RECIPIENT}/${RECORD.FILENAME}/${RECORD.DATA}`
    ).then(
      async (RESPONSE) => {
        switch (RESPONSE.status) {
          case STATUS.ACCEPTED:
            return;
        }
        throw await RESPONSE.text();
      },
      (ERR) => {
        throw ERR;
      }
    );
  }
  function PROCESS_INVITATION(DETAILS: INVITATION): VESSEL {
    DETAILS.OTHER_VESSELS.forEach((v) =>
      THE_TABLE.appendChild(SHAPE_VESSEL_HTML_ELEMENT(v))
    );
    return { MONIKER: DETAILS.MONIKER, PASSWORD: DETAILS.PASSWORD };
  }

  function SHAPE_VESSEL_HTML_ELEMENT(VESSEL: string) {
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
    let vessel = table.firstElementChild
      ?.firstElementChild as HTMLTableRowElement;

    return vessel;
  }

  CONNECT_BUTTON.addEventListener("click", async (ev) => {
    ev.preventDefault();
    THE_SELF = PROCESS_INVITATION(await RECIEVE_INVITATION());
    THE_SOURCE_CONNECTION = CONNECT_TO_SOURCE();
    CONNECT_BUTTON.style.display = "none";
  });
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
}

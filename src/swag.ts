namespace SOURCE_CONNECTOR {
  namespace SOURCE_MISSIVE {
    export const events: [string, (EVENT: MessageEvent<string>) => void][] = [
      [
        "RECIEVE_MEDIA",
        (EVENT) => {
          console.log(EVENT.data);
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
          console.log(EVENT.type, MISSIVE);
          THE_TABLE.appendChild(SHAPE_VESSEL_HTML_ELEMENT(MISSIVE.MONIKER));
          
        },
      ],
      [
        "VESSEL_LEFT",
        (EVENT) => {
          const MISSIVE = JSON.parse(EVENT.data) as SOURCE_MISSIVE.VESSEL_LEFT;
          console.log(EVENT.type, MISSIVE);
          document
            .querySelector(`.VESSEL[moniker="${MISSIVE.MONIKER}"]`)
            ?.remove();
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
  const CONNECT_BUTTON = <HTMLButtonElement>(
    document.querySelector("#CONNECT_BUTTON")
  );
  const THE_TABLE = <HTMLTableElement>document.querySelector("#THE_TABLE");
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

  function SHAPE_VESSEL_HTML_ELEMENT(MONIKER: string) {
    console.log(MONIKER);
    let TABLE = document.createElement("table");
    TABLE.innerHTML = `
    <tbody>
      <tr class="VESSEL" moniker="${MONIKER}">
        <td class="STATUS OUT">
          <div class="IN"></div>
        </td>
        <td class="NAME OUT">
          <div class="CENTERER">
            <div>${MONIKER}</div>
          </div>
        </td>
        <td class="MISSIVE_INPUT OUT CENTERER" style="display: inline-flex;">
          <input class="IN H2" type="text" placeholder="SEND MISSIVE...">
          <div class="BUTTON CENTERER">SEND</div>
        </td><td class="RECORD_INPUT OUT" style="display: inline-flex;">
          <div class="BUTTON CENTERER">SEND RECORD</div>
          <input type="file" value="HAHA">
        </td>
      </tr>
    </tbody>`.trim();
    let VESSEL = <HTMLTableRowElement>(
      TABLE.firstElementChild?.firstElementChild
    );
    VESSEL.querySelector(".MISSIVE_INPUT > .BUTTON")?.addEventListener(
      "click",
      (ev) => {
        ev.preventDefault();
        let MISSIVE = (<HTMLInputElement>(
          VESSEL.querySelector('.MISSIVE_INPUT > input[type="text"]')
        )).value.trim();
        if (MISSIVE !== "") {
          SEND_MISSIVE_TO(MONIKER, MISSIVE.toUpperCase()).catch((reason) =>
            alert(`Failed to send missive to ${MONIKER} Reason:"${reason}"`)
          );
        }
      }
    );

    return VESSEL;
  }

  CONNECT_BUTTON.addEventListener("click", async (ev) => {
    ev.preventDefault();
    THE_SELF = PROCESS_INVITATION(await RECIEVE_INVITATION());
    THE_SOURCE_CONNECTION = CONNECT_TO_SOURCE();
    CONNECT_BUTTON.style.display = "none";
  });
}

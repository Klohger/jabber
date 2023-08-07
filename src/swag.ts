namespace SOURCE_CONNECTOR {
  namespace SOURCE_MISSIVE {
    export namespace INVITATION_REQUEST_RESPONSE {
      export type TOO_COMPLEX = { TYPE: "TOO_COMPLEX" };
      export type MONIKER_TAKEN = { TYPE: "MONIKER_TAKEN" };
      export type INVITATION = VESSEL & {
        TYPE: "INVITATION";
        OTHER_VESSELS: string[];
      };
    }
    export type INVITATION_REQUEST_RESPONSE = {
      TYPE: "INVITATION_REQUEST_RESPONSE";
      RESPONSE:
        | INVITATION_REQUEST_RESPONSE.INVITATION
        | INVITATION_REQUEST_RESPONSE.MONIKER_TAKEN
        | INVITATION_REQUEST_RESPONSE.TOO_COMPLEX;
    };
    export type RECIEVE_MEDIA = {
      TYPE: "RECIEVE_MEDIA";
      MONIKER: string;
      MEDIA: MEDIA;
    };
    export type VESSEL_ENTERED = {
      TYPE: "VESSEL_ENTERED";
      MONIKER: string;
    };
    export namespace VESSEL_LEFT {
      export type LEAVE_REASON = "SOURCE_SHUT_DOWN" | "AFK";
    }
    export type VESSEL_LEFT = {
      TYPE: "VESSEL_LEFT";
      MONIKER: VESSEL_LEFT.LEAVE_REASON;
    };
    export type INVALID_CREDENTIALS = {
      TYPE: "INVALID_CREDENTIALS";
    };
  }

  type SOURCE_MISSIVE =
    | SOURCE_MISSIVE.INVITATION_REQUEST_RESPONSE
    | SOURCE_MISSIVE.RECIEVE_MEDIA
    | SOURCE_MISSIVE.VESSEL_ENTERED
    | SOURCE_MISSIVE.VESSEL_LEFT
    | SOURCE_MISSIVE.INVALID_CREDENTIALS;
  namespace VESSEL_MISSIVE {
    export type REQUEST_INVITATION = {
      TYPE: "REQUEST_INVITATION";
      SUGGESTED_USERNAME: string;
    };
    export type SEND_MEDIA = {
      TYPE: "SEND_MEDIA";
      RECIPIENT: string;
      MEDIA: MEDIA;
    };
  }
  type VESSEL_MISSIVE =
    | VESSEL_MISSIVE.REQUEST_INVITATION
    | VESSEL_MISSIVE.SEND_MEDIA;
  type VESSEL = {
    MONIKER: string;
    PASSWORD: string;
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

  let SOURCE_CONNECTION!: WebSocket;
  const CONNECT_BUTTON = <HTMLButtonElement>(
    document.querySelector("#CONNECT_BUTTON")
  );
  const THE_TABLE = <HTMLTableElement>document.querySelector("#THE_TABLE");
  let THE_SELF: VESSEL;
  function SEND_VESSEL_MISSIVE(MISSIVE: VESSEL_MISSIVE) {
    SOURCE_CONNECTION.send(JSON.stringify(MISSIVE));
  }
  const WEB_SOCKET_SUFFIX: string =
    window.location.protocol.replace("http", "ws") + window.location.host;
  function CONNECT_TO_SOURCE() {
    SOURCE_CONNECTION = new WebSocket(
      `${WEB_SOCKET_SUFFIX}/THE_SOURCE/ENTER/${THE_SELF.MONIKER}/${THE_SELF.PASSWORD}`
    );
    SOURCE_CONNECTION.onopen = (_) => {
      SEND_VESSEL_MISSIVE({
        TYPE: "REQUEST_INVITATION",
        SUGGESTED_USERNAME: "GamerJoe",
      });
    };
    SOURCE_CONNECTION.onmessage = async (ev) => {
      const MISSIVE: SOURCE_MISSIVE = JSON.parse(ev.data);
      console.log("Recieved:", MISSIVE);
      /*
    type Map<K extends string | number | symbol, T> = Record<K, T>;

    export const MISSIVE_HANDLERS: Map<
      string,
      (SOURCE_MISSIVE: SOURCE_MISSIVE) => void
    > = {
      RECIEVE_MEDIA: (SOURCE_MISSIVE) => {
        const MISSIVE = SOURCE_MISSIVE as SOURCE_MISSIVE.RECIEVE_MEDIA;
      },

      FORCEFUL_LEAVE: (SOURCE_MISSIVE) => {
        const MISSIVE = SOURCE_MISSIVE as SOURCE_MISSIVE.FORCEFUL_LEAVE;
        THE_TABLE.innerHTML = "";
        SOURCE_CONNECTION.close();
        CONNECT_BUTTON.style.display = "block";
      },
    };
    */
      switch (MISSIVE.TYPE) {
        case "INVALID_CREDENTIALS":
          ((x: never) => x)(MISSIVE);
          break;
        case "INVITATION_REQUEST_RESPONSE":
          ((x: never) => x)(MISSIVE);
          break;
        case "RECIEVE_MEDIA":
          ((x: never) => x)(MISSIVE);
          break;
        case "VESSEL_ENTERED":
          THE_TABLE.appendChild(SHAPE_VESSEL_HTML_ELEMENT(MISSIVE.MONIKER));
          break;
        case "VESSEL_LEFT":
          document
            .querySelector(`.VESSEL[moniker="${MISSIVE.MONIKER}"]`)
            ?.remove();
          break;
        default:
          ((x: never) => x)(MISSIVE);
      }
    };
  }
  function PROCESS_INVITATION(
    DETAILS: SOURCE_MISSIVE.INVITATION_REQUEST_RESPONSE.INVITATION
  ): VESSEL {
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
          SEND_VESSEL_MISSIVE({
            TYPE: "SEND_MEDIA",
            RECIPIENT: MONIKER,
            MEDIA: { TYPE: "MISSIVE", TEXT: MISSIVE.toUpperCase() },
          });
        }
      }
    );

    return VESSEL;
  }

  CONNECT_BUTTON.addEventListener("click", async (ev) => {
    ev.preventDefault();
    CONNECT_TO_SOURCE();
    CONNECT_BUTTON.style.display = "none";
  });
}

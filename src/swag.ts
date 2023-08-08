"use strict";
import * as msgpack from "./msgpack";

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
    export type LEAVE_REASON =
      | "INVALID_CREDENTIALS"
      | "SOURCE_SHUT_DOWN"
      | "VESSEL_DISCONNECTED"
      | "TIMED_OUT";
    export type VESSEL_LEFT = {
      TYPE: "VESSEL_LEFT";
      MONIKER: string;
      REASON: LEAVE_REASON;
    };
    export type DISCONNECT = {
      TYPE: "DISCONNECT";
      REASON: LEAVE_REASON;
    };
  }

  type SOURCE_MISSIVE =
    | SOURCE_MISSIVE.INVITATION_REQUEST_RESPONSE
    | SOURCE_MISSIVE.RECIEVE_MEDIA
    | SOURCE_MISSIVE.VESSEL_ENTERED
    | SOURCE_MISSIVE.VESSEL_LEFT
    | SOURCE_MISSIVE.DISCONNECT;
  namespace VESSEL_MISSIVE {
    export type REQUEST_INVITATION = {
      TYPE: "REQUEST_INVITATION";
      SUGGESTED_MONIKER: string;
    };
    export type SEND_MEDIA = {
      TYPE: "SEND_MEDIA";
      RECIPIENT: string;
      MEDIA: MEDIA;
    };
  }
  type VESSEL_MISSIVE =
    | VESSEL_MISSIVE.REQUEST_INVITATION
    | (VESSEL & VESSEL_MISSIVE.SEND_MEDIA);
  type VESSEL = {
    MONIKER: string;
    PASSWORD: string;
  };
  /*
  type STATUS = "DEFAULT" | "ALERT";
  
  class EXTERNAL_VESSEL {
    MONIKER: string;
    STATUS_ICON: HTMLDivElement;
    STATUS_CHANGER_ABORT: AbortController = new AbortController();
    constructor(MONIKER: string, STATUS_ICON: HTMLDivElement) {
      this.MONIKER = MONIKER;
      this.STATUS_ICON = STATUS_ICON;
    }
    async SetStatus(STATUS: STATUS) {
      switch (STATUS) {
        case "DEFAULT":
          this.STATUS_CHANGER_ABORT.abort();
          this.STATUS_ICON.classList.remove("ALERT_0", "ALERT_1");
          this.STATUS_ICON.classList.add("DEFAULT_0");
          break;
        case "ALERT":
          async () => {
            const abortListener = () => {
              this.STATUS_CHANGER_ABORT.signal.removeEventListener(
                "abort",
                abortListener
              );
              throw undefined;
            };
            this.STATUS_CHANGER_ABORT.signal.addEventListener(
              "abort",
              abortListener
            );
            this.STATUS_ICON.classList.add("ALERT_0");
            while (await new Promise<true>((r) => setTimeout(r, 500))) {
              this.STATUS_ICON.classList.toggle("ALERT_0");
              this.STATUS_ICON.classList.toggle("ALERT_1");
            }
          };
          break;
      }
    }
  }
  */
  type RECORD = {
    TYPE: "RECORD";
    FILE_NAME: string;
    DATA: Uint8Array;
  };
  type MISSIVE = {
    TYPE: "MISSIVE";
    TEXT: String;
  };
  export type MEDIA = RECORD | MISSIVE;

  let SOURCE_CONNECTION!: WebSocket;
  const CONNECT_BUTTON = <HTMLButtonElement>(
    document.querySelector("#CONNECT_BUTTON")
  );
  const THE_TABLE = <HTMLTableElement>document.querySelector("#THE_TABLE");
  let THE_SELF: VESSEL;
  //let OTHERS: EXTERNAL_VESSEL[] = [];
  function SEND_VESSEL_MISSIVE(MISSIVE: VESSEL_MISSIVE) {
    SOURCE_CONNECTION.send(msgpack.serialize(MISSIVE));
  }
  const WEB_SOCKET_SUFFIX: string =
    window.location.protocol.replace("http", "ws") + window.location.host;
  function CONNECT_TO_SOURCE() {
    SOURCE_CONNECTION = new WebSocket(`${WEB_SOCKET_SUFFIX}/THE_SOURCE`);
    SOURCE_CONNECTION.onopen = (_) => {
      SEND_VESSEL_MISSIVE({
        TYPE: "REQUEST_INVITATION",
        SUGGESTED_MONIKER: (() => {
          let sugg: string | null;
          do {
            sugg = prompt("yooo");
          } while (sugg === null);
          return sugg;
        })(),
      });
    };
    SOURCE_CONNECTION.onmessage = async (ev: MessageEvent<Blob>) => {
      console.log(ev.data);
      const MISSIVE: SOURCE_MISSIVE = msgpack.deserialize(
        new Uint8Array(await ev.data.arrayBuffer())
      ) as SOURCE_MISSIVE;
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
        case "INVITATION_REQUEST_RESPONSE":
          switch (MISSIVE.RESPONSE.TYPE) {
            case "INVITATION":
              MISSIVE.RESPONSE.OTHER_VESSELS.forEach((v) =>
                THE_TABLE.appendChild(SHAPE_VESSEL_HTML_ELEMENT(v))
              );
              THE_SELF = {
                MONIKER: MISSIVE.RESPONSE.MONIKER,
                PASSWORD: MISSIVE.RESPONSE.PASSWORD,
              };
              break;
            case "MONIKER_TAKEN":
              SEND_VESSEL_MISSIVE({
                TYPE: "REQUEST_INVITATION",
                SUGGESTED_MONIKER: (() => {
                  let sugg: string | null;
                  do {
                    sugg = prompt("yooo");
                  } while (sugg === null);
                  return sugg;
                })(),
              });
              break;
            case "TOO_COMPLEX":
              SEND_VESSEL_MISSIVE({
                TYPE: "REQUEST_INVITATION",
                SUGGESTED_MONIKER: (() => {
                  let sugg: string | null;
                  do {
                    sugg = prompt("yooo");
                  } while (sugg === null);
                  return sugg;
                })(),
              });
              break;
          }
          break;
        case "RECIEVE_MEDIA":
          switch (MISSIVE.MEDIA.TYPE) {
            case "MISSIVE":
              alert(
                `RECIEVED MISSIVE FROM "${MISSIVE.MONIKER}":\n${MISSIVE.MEDIA.TEXT}`
              );
              break;
            case "RECORD":
              alert(
                `RECIEVED RECORD "${MISSIVE.MEDIA.FILE_NAME}" FROM "${MISSIVE.MONIKER}". Downloading...`
              );
              const link = document.createElement("a");
              const file = new Blob([new Uint8Array(MISSIVE.MEDIA.DATA)]);
              link.href = URL.createObjectURL(file);
              link.download = MISSIVE.MEDIA.FILE_NAME;
              link.click();
              link.remove();
              break;
          }
          break;
        case "VESSEL_ENTERED":
          THE_TABLE.appendChild(SHAPE_VESSEL_HTML_ELEMENT(MISSIVE.MONIKER));
          break;
        case "VESSEL_LEFT":
          (
            document.querySelector(
              `.VESSEL[moniker="${MISSIVE.MONIKER}"]`
            ) as Element
          ).remove();
          break;
        case "DISCONNECT":
          SEND_VESSEL_MISSIVE({
            TYPE: "REQUEST_INVITATION",
            SUGGESTED_MONIKER: (() => {
              let sugg: string | null;
              do {
                sugg = prompt("yooo");
              } while (sugg === null);
              return sugg;
            })(),
          });
          break;
      }
    };
  }

  function SHAPE_VESSEL_HTML_ELEMENT(MONIKER: string) {
    console.log(MONIKER);
    let TABLE = document.createElement("table");
    TABLE.innerHTML = `
    <tbody>
      <tr class="VESSEL" moniker="${MONIKER}">
        <td class="STATUS OUT">
          <div class="IN DEFAULT_0"></div>
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
      (TABLE.firstElementChild as Element).firstElementChild
    );
    /*
    OTHERS.push(
      new EXTERNAL_VESSEL(
        MONIKER,
        VESSEL.querySelector(".STATUS > div") as HTMLDivElement
      )
    );
    */
    (
      VESSEL.querySelector(".MISSIVE_INPUT > .BUTTON") as HTMLDivElement
    ).addEventListener("click", (ev) => {
      ev.preventDefault();
      let MISSIVE = (<HTMLInputElement>(
        VESSEL.querySelector('.MISSIVE_INPUT > input[type="text"]')
      )).value.trim();
      if (MISSIVE !== "") {
        SEND_VESSEL_MISSIVE({
          ...THE_SELF,
          TYPE: "SEND_MEDIA",
          RECIPIENT: MONIKER,
          MEDIA: { TYPE: "MISSIVE", TEXT: MISSIVE.toUpperCase() },
        });
      }
    });
    const input = VESSEL.querySelector<HTMLInputElement>(
      '.RECORD_INPUT > input[type="file"]'
    ) as HTMLInputElement;
    input.addEventListener("change", async () => {
      SEND_VESSEL_MISSIVE({
        TYPE: "SEND_MEDIA",
        MONIKER: THE_SELF.MONIKER,
        PASSWORD: THE_SELF.PASSWORD,
        RECIPIENT: MONIKER,
        MEDIA: {
          TYPE: "RECORD",
          FILE_NAME: ((input.files as FileList).item(0) as File).name as string,
          DATA: new Uint8Array(
            (await (
              (input.files as FileList).item(0) as File
            ).arrayBuffer()) as ArrayBuffer
          ),
        },
      });
    });

    (
      VESSEL.querySelector(".RECORD_INPUT > .BUTTON") as Element
    ).addEventListener("click", (ev) => {
      ev.preventDefault();

      input.click();
    });

    return VESSEL;
  }

  CONNECT_BUTTON.addEventListener("click", async (ev) => {
    ev.preventDefault();
    CONNECT_TO_SOURCE();
    CONNECT_BUTTON.style.display = "none";
  });
}

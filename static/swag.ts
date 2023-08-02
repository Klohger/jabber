namespace SOURCE_CONNECTOR {
  interface Record {
    moniker: string;
    data: string;
  }

  namespace ServerMessage {
    export const events: [string, (ev: MessageEvent<string>) => void][] = [
      [
        "RecieveMissiveFrom",
        (ev) => {
          const message = JSON.parse(
            ev.data
          ) as ServerMessage.RecieveMissiveFrom;
          console.log(ev.type, message);
        },
      ],
      [
        "RecieveRecordFrom",
        (ev) => {
          const message = JSON.parse(
            ev.data
          ) as ServerMessage.RecieveRecordFrom;
          console.log(ev.type, message);
        },
      ],
      [
        "VesselEntered",
        (ev) => {
          const message = JSON.parse(ev.data) as ServerMessage.VesselEntered;
          THE_LIST.appendChild(CreateVesselHTMLElement(message.moniker));
          console.log(ev.type, message);
        },
      ],
      [
        "VesselLeft",
        (ev) => {
          const message = JSON.parse(ev.data) as ServerMessage.VesselLeft;
          document.querySelectorAll(`[vessel="${message.moniker}"]`).item(0)
            .remove;
          console.log(ev.type, message);
        },
      ],
      [
        "ForcefulLeave",
        (ev) => {
          const message = JSON.parse(ev.data) as ServerMessage.ForcefulLeave;
          THE_LIST.innerHTML = "";
          console.log(ev.type, message);
          eventSource.close();
        },
      ],
      [
        "Unworthy",
        (ev) => {
          const message = JSON.parse(ev.data) as ServerMessage.Unworthy;
          console.log(ev.type, message);
          eventSource.close();
        },
      ],
    ];

    export type RecieveMissiveFrom = {
      moniker: string;
      message: string;
    };
    export type RecieveRecordFrom = {
      moniker: string;
      record: Record;
    };
    export type VesselEntered = {
      moniker: string;
    };
    export type VesselLeft = {
      moniker: string;
    };
    export type ForcefulLeave = string;
    export type Unworthy = string;
  }
  type ServerMessage =
    | ServerMessage.RecieveMissiveFrom
    | ServerMessage.RecieveRecordFrom
    | ServerMessage.VesselEntered
    | ServerMessage.VesselLeft
    | ServerMessage.ForcefulLeave
    | ServerMessage.Unworthy;

  type Vessel = {
    moniker: string;
    password: string;
  };

  type SourceEntranceDetails = Vessel & {
    otherVessels: string[];
  };

  const enum Status {
    ACCEPTED = 202,
    UNAUTHORIZED = 401,
  }

  let eventSource!: EventSource;
  const THE_LIST = document.getElementById("THE_LIST") as HTMLUListElement;
  function RequestInvitation(args: { moniker_suggestion: string }) {
    return fetch(
      `THE_SOURCE/REQUEST_INVITATION/${args.moniker_suggestion}`
    ).then(
      async (response): Promise<SourceEntranceDetails> => {
        switch (response.status) {
          case Status.ACCEPTED:
            let details = (await response.json()) as SourceEntranceDetails;
            return details;
        }
        throw await response.text();
      },
      (err) => {
        throw err;
      }
    );
  }
  async function RecieveInvitation() {
    let details!: SourceEntranceDetails;
    {
      let error_message: null | string = null;
      let moniker_suggestion: string | null;
      let promise!: Promise<SourceEntranceDetails>;
      do {
        moniker_suggestion = prompt(
          error_message === null
            ? "Choose a moniker to wield for THE SOURCE."
            : error_message
        );
        if (moniker_suggestion === null) continue;
        promise = RequestInvitation({ moniker_suggestion });
      } while (
        await promise.then(
          (res) => {
            details = res;
            return false;
          },
          (err: string) => {
            error_message = err;
            return true;
          }
        )
      );
    }
    return details;
  }
  function EnterSource(vessel: Vessel) {
    eventSource = new EventSource(
      `THE_SOURCE/ENTER/${vessel.moniker}/${vessel.password}`
    );

    eventSource.onopen = (_) => {
      console.log("entered THE SOURCE");
    };
    ServerMessage.events.forEach(([type, event]) => {
      console.log(type);
      eventSource.addEventListener(type, event);
    });
  }

  function SendMessageTo(other: string, message: string) {}
  function SendRecordTo(other: string, record: Record) {}
  function ProcessInvitation(details: SourceEntranceDetails): Vessel {
    details.otherVessels.forEach((v) =>
      THE_LIST.appendChild(CreateVesselHTMLElement(v))
    );
    return { ...details };
  }

  function CreateVesselHTMLElement(vessel: string) {
    let div = document.createElement("div");

    div.setAttribute("vessel", vessel);
    let img = document.createElement("img");
    img.src = "COMPUTER_ICON";
    img.style.height="1rem"
    img.style.width="1rem"
    div.appendChild(img);
    div.appendChild(document.createTextNode(vessel));
    return div;
  }

  (async () => EnterSource(ProcessInvitation(await RecieveInvitation())))();
}

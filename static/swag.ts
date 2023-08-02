namespace SOURCE_CONNECTOR {
  interface Record {
    moniker: string;
    data: string;
  }

  namespace ServerMessage {
    export const events: [string, (ev: MessageEvent<string>) => void][] = [
      [
        "RecieveMessageFrom",
        (ev) => {
          const message = JSON.parse(
            ev.data
          ) as ServerMessage.RecieveMessageFrom;
          console.log("RecieveMessageFrom", message);
        },
      ],
      [
        "RecieveRecordFrom",
        (ev) => {
          const message = JSON.parse(
            ev.data
          ) as ServerMessage.RecieveRecordFrom;
          console.log("RecieveRecordFrom", message);
        },
      ],
      [
        "VesselEntered",
        (ev) => {
          const message = JSON.parse(ev.data) as ServerMessage.VesselEntered;
          THE_LIST.appendChild(CreateVesselHTMLElement(message.moniker));
          console.log("VesselEntered", message);
        },
      ],
      [
        "VesselLeft",
        (ev) => {
          const message = JSON.parse(ev.data) as ServerMessage.VesselLeft;
          document.getElementById(message.moniker)?.remove();
          console.log("VesselLeft", message);
        },
      ],
      [
        "Disconnect",
        (ev) => {
          const message = JSON.parse(ev.data) as ServerMessage.Disconnect;
          THE_LIST.innerHTML = "";
          console.log("Disconnect", message);
          eventSource.close();
        },
      ],
      [
        "Unworthy",
        (ev) => {
          const message = JSON.parse(ev.data) as ServerMessage.Unworthy;
          console.log("Unworthy", message);
          eventSource.close();
        },
      ],
    ];

    export type RecieveMessageFrom = {
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
    export type Disconnect = string;
    export type Unworthy = string;
  }
  type ServerMessage =
    | ServerMessage.RecieveMessageFrom
    | ServerMessage.RecieveRecordFrom
    | ServerMessage.VesselEntered
    | ServerMessage.VesselLeft
    | ServerMessage.Disconnect
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

  export let eventSource: EventSource;
  const THE_LIST = document.getElementById("THE_LIST") as HTMLUListElement;
  function AttemptSourceEntrance(args: { moniker_suggestion: string }) {
    return fetch(`ATTEMPT_SOURCE_ENTRANCE/${args.moniker_suggestion}`).then(
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
  async function GetSourceEntranceDetails() {
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
        promise = AttemptSourceEntrance({ moniker_suggestion });
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
      `THE_SOURCE/${vessel.moniker}/${vessel.password}`
    );

    eventSource.onopen = (_) => {
      console.log("entered THE SOURCE");
    };
    ServerMessage.events.forEach(([type, event]) =>
      eventSource.addEventListener(type, event)
    );
  }

  function SendMessageTo(other: string, message: string) {}
  function SendRecordTo(other: string, record: Record) {}
  function ProcessSourceEntranceDetails(
    details: SourceEntranceDetails
  ): Vessel {
    details.otherVessels.forEach((v) =>
      THE_LIST.appendChild(CreateVesselHTMLElement(v))
    );
    return { ...details };
  }

  function CreateVesselHTMLElement(vessel: string) {
    let div = document.createElement("div");
    div.id = vessel;
    let img = document.createElement("img");
    img.src = "COMPUTER_ICON";
    div.appendChild(img);
    div.innerText = vessel;
    return div;
  }
  (async () =>
    EnterSource(
      ProcessSourceEntranceDetails(await GetSourceEntranceDetails())
    ))();
}

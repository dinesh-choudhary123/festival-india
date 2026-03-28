// ============================================
// Durable Object — Real-time Calendar Room
// Enables live collaboration on shared calendars
// ============================================

export class CalendarRoom implements DurableObject {
  private sessions: Map<WebSocket, { userId: string; name: string }> = new Map();
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/websocket") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      const userId = url.searchParams.get("userId") || "anonymous";
      const name = url.searchParams.get("name") || "Anonymous";

      this.sessions.set(server, { userId, name });

      server.accept();
      server.addEventListener("message", (event) => {
        this.handleMessage(server, event.data as string);
      });
      server.addEventListener("close", () => {
        this.sessions.delete(server);
        this.broadcast(
          JSON.stringify({
            type: "user_left",
            userId,
            name,
            activeUsers: this.getActiveUsers(),
          })
        );
      });

      // Notify others
      this.broadcast(
        JSON.stringify({
          type: "user_joined",
          userId,
          name,
          activeUsers: this.getActiveUsers(),
        })
      );

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Not found", { status: 404 });
  }

  private handleMessage(sender: WebSocket, data: string) {
    try {
      const message = JSON.parse(data);
      const session = this.sessions.get(sender);
      if (!session) return;

      switch (message.type) {
        case "add_to_calendar":
          this.broadcast(
            JSON.stringify({
              type: "calendar_updated",
              action: "add",
              festivalId: message.festivalId,
              userId: session.userId,
              name: session.name,
            }),
            sender
          );
          break;

        case "remove_from_calendar":
          this.broadcast(
            JSON.stringify({
              type: "calendar_updated",
              action: "remove",
              festivalId: message.festivalId,
              userId: session.userId,
              name: session.name,
            }),
            sender
          );
          break;

        case "cursor_move":
          this.broadcast(
            JSON.stringify({
              type: "cursor_update",
              userId: session.userId,
              name: session.name,
              position: message.position,
            }),
            sender
          );
          break;
      }
    } catch {
      // Ignore invalid messages
    }
  }

  private broadcast(message: string, exclude?: WebSocket) {
    for (const [ws] of this.sessions) {
      if (ws !== exclude) {
        try {
          ws.send(message);
        } catch {
          this.sessions.delete(ws);
        }
      }
    }
  }

  private getActiveUsers() {
    return Array.from(this.sessions.values()).map((s) => ({
      userId: s.userId,
      name: s.name,
    }));
  }
}

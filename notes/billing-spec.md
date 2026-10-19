# Billing spec (Phase 3)

See [`shared/billing.ts`](../shared/billing.ts) for `BillingQuote` and meter fields.

- **Seat**: workspace member with agent create permission.
- **LLM tokens**: OpenRouter usage attributed per workspace run tree.
- **Invoke**: `/api/mcp/invoke` and tool calls inside chat.
- **Storage**: `.data/storage/{workspaceId}` byte sum.
- **Compute**: future sandbox stdio CPU ms.

Stripe integration is out of scope until auth + workspace admin UI land.

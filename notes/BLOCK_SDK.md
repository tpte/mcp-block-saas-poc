# Block SDK

Submit a package via `POST /api/blocks/packages`:

```json
{
  "name": "hello",
  "version": "1.0.0",
  "componentId": "demo/hello@1.0.0",
  "propsSchema": { "title": { "type": "string" } },
  "bundle": {
    "template": "document",
    "body": "Hello from custom block"
  }
}
```

Approve: `POST /api/blocks/packages/:id/approve`.

Use in compose:

```json
{ "kind": "pkg", "packageRef": "pkg:demo/hello@1.0.0", "title": "自訂 Block" }
```

Props must align with [`BlockAction`](../shared/ui.ts). Sandbox renders bundle JSON client-side in `PackageBlock`.

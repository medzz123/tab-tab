# Tab Tab

## Setup

```bash
pnpm install
make s
```

The app will be available at `http://localhost:7000` and the API at `http://localhost:7001`.

## Technical Decisions

- **Hono**: Chosen for easy WebSocket support
- **Hocuspocus**: Provides merge conflict resolution and robust collaboration features
- **TipTap**: Modern editor with built-in collaboration and awareness features

## Future Improvements

- Improve snapshots to include rich editor styles
- Save to database periodically to prevent data loss on server crashes
- Do snapshots differently to include all edits instead of replacing raw text, so we don't lose history of who is writing what
- Use tRPC instead of REST for everything that is not WebSocket-related, so it's type-safe with auto-generated types

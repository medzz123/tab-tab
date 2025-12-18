import 'dotenv/config';
import { Hocuspocus } from '@hocuspocus/server';
import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { log } from '@tab-tab/logger';
import { Hono } from 'hono';
import * as Y from 'yjs';
import { env } from './env';

const documentCache = new Map<string, Y.Doc>();

const hocuspocus = new Hocuspocus({
  name: 'default-instance',
  quiet: true,
  unloadImmediately: false,
  async onLoadDocument({ documentName }) {
    if (documentCache.has(documentName)) {
      const existingDoc = documentCache.get(documentName)!;
      log.info(`Loading existing document from cache: ${documentName}`);
      return existingDoc;
    }

    const newDoc = new Y.Doc();
    documentCache.set(documentName, newDoc);
    log.info(`Created new document in cache: ${documentName}`);
    return newDoc;
  },
});

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.get(
  '/collaboration',
  upgradeWebSocket((connection) => ({
    onOpen(_evt, ws) {
      if (ws !== undefined) {
        hocuspocus.handleConnection(ws.raw!, connection.req.raw as any);
      }
    },
  }))
);

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
});

injectWebSocket(server);

log.info(`Server listening on port ${env.PORT}`);

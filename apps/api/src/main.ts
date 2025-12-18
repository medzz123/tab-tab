import 'dotenv/config';
import { Hocuspocus } from '@hocuspocus/server';
import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { log } from '@tab-tab/logger';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as Y from 'yjs';
import { env } from './env';

type DocumentVersion = {
  id: string;
  name: string;
  timestamp: number;
  state: Uint8Array;
};

const versionHistory = new Map<string, DocumentVersion[]>();

const createSnapshotFromState = (
  documentName: string,
  state: Uint8Array,
  name: string
): DocumentVersion => {
  const version: DocumentVersion = {
    id: name,
    name,
    timestamp: Date.now(),
    state,
  };

  const versions = versionHistory.get(documentName) ?? [];
  const existingIndex = versions.findIndex((v) => v.id === name);

  if (existingIndex >= 0) {
    versions[existingIndex] = version;
  } else {
    versions.push(version);
  }

  versionHistory.set(documentName, versions);

  return version;
};

const hocuspocus = new Hocuspocus({
  name: 'default-instance',
  quiet: true,
  unloadImmediately: false,
  async onLoadDocument() {
    return new Y.Doc();
  },
});

const app = new Hono();
app.use('*', cors());

app.get('/api/versions/:documentName', (c) => {
  const versions = versionHistory.get(c.req.param('documentName')) ?? [];
  return c.json({
    versions: versions.map(({ id, name, timestamp }) => ({ id, name, timestamp })),
  });
});

app.post('/api/versions/:documentName/snapshot', async (c) => {
  const documentName = c.req.param('documentName');
  const body = await c.req.json();
  const name = body.name || `Snapshot ${Date.now()}`;

  const direct = await hocuspocus.openDirectConnection(documentName, {});
  try {
    const state = Y.encodeStateAsUpdate(direct.document as Y.Doc);
    const version = createSnapshotFromState(documentName, state, name);
    return c.json({
      success: true,
      id: version.id,
      name: version.name,
      timestamp: version.timestamp,
    });
  } finally {
    await direct.disconnect();
  }
});

app.post('/api/versions/:documentName/:versionId/apply', async (c) => {
  const documentName = c.req.param('documentName');
  const versionId = c.req.param('versionId');

  const versions = versionHistory.get(documentName) ?? [];
  const version = versions.find((v) => v.id === versionId);
  if (!version) return c.json({ error: 'Version not found' }, 404);

  const direct = await hocuspocus.openDirectConnection(documentName, {});
  try {
    await direct.transact((doc) => {
      const fragment = doc.getXmlFragment('default');
      const len = fragment.length;
      if (len > 0) fragment.delete(0, len);

      Y.applyUpdate(doc, version.state);
    });

    return c.json({
      success: true,
      id: version.id,
      name: version.name,
      timestamp: version.timestamp,
    });
  } finally {
    await direct.disconnect();
  }
});

app.delete('/api/versions/:documentName', (c) => {
  const documentName = c.req.param('documentName');
  versionHistory.delete(documentName);
  return c.json({ success: true });
});

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.get(
  '/collaboration',
  upgradeWebSocket((connection) => ({
    onOpen(_evt, ws) {
      hocuspocus.handleConnection(ws.raw!, connection.req.raw as never);
    },
  }))
);

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
});

injectWebSocket(server);

log.info(`Server listening on port ${env.PORT}`);

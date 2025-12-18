import 'dotenv/config';
import { Hocuspocus } from '@hocuspocus/server';
import { TiptapTransformer } from '@hocuspocus/transformer';
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

const extractTextFromPM = (node: unknown): string => {
  if (
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean' ||
    node == null
  )
    return '';

  if (Array.isArray(node)) return node.map(extractTextFromPM).join('');

  if (typeof node === 'object') {
    const rec = node as Record<string, unknown>;
    const type = rec.type;
    if (type === 'text') {
      const text = rec.text;
      return typeof text === 'string' ? text : '';
    }

    const content = rec.content;
    const joined = extractTextFromPM(content);

    if (type === 'paragraph' || type === 'heading' || type === 'blockquote' || type === 'listItem')
      return joined + '\n';

    return joined;
  }

  return '';
};

app.post('/api/versions/:documentName/:versionId/apply', async (context) => {
  const documentName = context.req.param('documentName');
  const versionId = context.req.param('versionId');

  const versions = versionHistory.get(documentName) ?? [];
  const version = versions.find((version) => version.id === versionId);
  if (!version) return context.json({ error: 'Version not found' }, 404);

  const direct = await hocuspocus.openDirectConnection(documentName, {});
  try {
    const snapshotDoc = new Y.Doc();
    Y.applyUpdate(snapshotDoc, version.state);

    const snapshotJson = TiptapTransformer.fromYdoc(snapshotDoc, 'default');
    const raw = extractTextFromPM(snapshotJson).trimEnd();

    await direct.transact((liveDocument) => {
      const liveFragment = liveDocument.getXmlFragment('default');
      if (liveFragment.length > 0) liveFragment.delete(0, liveFragment.length);

      const paragraph = new Y.XmlElement('paragraph');
      const t = new Y.XmlText();
      if (raw.length > 0) t.insert(0, raw);
      paragraph.insert(0, [t]);
      liveFragment.insert(0, [paragraph]);
    });

    return context.json({
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

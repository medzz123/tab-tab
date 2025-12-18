import 'dotenv/config';
import { Hocuspocus } from '@hocuspocus/server';
import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { log } from '@tab-tab/logger';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as Y from 'yjs';
import { env } from './env';

const documentCache = new Map<string, Y.Doc>();

type DocumentVersion = {
  id: string;
  timestamp: number;
  state: Uint8Array;
};

const versionHistory = new Map<string, DocumentVersion[]>();

// Helper function to create a snapshot
const createSnapshot = (documentName: string, document: Y.Doc) => {
  const state = Y.encodeStateAsUpdate(document);
  const version: DocumentVersion = {
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: Date.now(),
    state,
  };

  if (!versionHistory.has(documentName)) {
    versionHistory.set(documentName, []);
  }

  const versions = versionHistory.get(documentName)!;
  versions.push(version);

  // Keep only last 50 versions per document
  if (versions.length > 50) {
    versions.shift();
  }

  log.info(`Created snapshot ${version.id} for document ${documentName}`);
  return version;
};

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

    // Initialize version history tracking
    if (!versionHistory.has(documentName)) {
      versionHistory.set(documentName, []);
    }

    log.info(`Created new document in cache: ${documentName}`);
    return newDoc;
  },
});

const app = new Hono();

app.use('*', cors());

app.get('/api/versions/:documentName', async (c) => {
  const documentName = c.req.param('documentName');
  const versions = versionHistory.get(documentName) || [];

  return c.json({
    versions: versions.map((v) => ({
      id: v.id,
      timestamp: v.timestamp,
    })),
  });
});

app.post('/api/versions/:documentName/snapshot', async (c) => {
  const documentName = c.req.param('documentName');
  const doc = documentCache.get(documentName);

  if (!doc) {
    return c.json({ error: 'Document not found' }, 404);
  }

  const version = createSnapshot(documentName, doc);

  return c.json({
    success: true,
    id: version.id,
    timestamp: version.timestamp,
  });
});

app.post('/api/versions/:documentName/:versionId/apply', async (c) => {
  const documentName = c.req.param('documentName');
  const versionId = c.req.param('versionId');
  const versions = versionHistory.get(documentName) || [];
  const version = versions.find((v) => v.id === versionId);

  if (!version) {
    return c.json({ error: 'Version not found' }, 404);
  }

  const doc = documentCache.get(documentName);
  if (!doc) {
    return c.json({ error: 'Document not found' }, 404);
  }

  // Create a new document with the version state
  const newDoc = new Y.Doc();
  Y.applyUpdate(newDoc, version.state);

  // Replace the document in cache
  documentCache.set(documentName, newDoc);

  log.info(`Applied version ${versionId} to document ${documentName}`);

  return c.json({ success: true, id: version.id, timestamp: version.timestamp });
});

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

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
const editCounts = new Map<string, number>();
const currentVersionIndices = new Map<string, number>();

const EDIT_COUNT_THRESHOLD = 5;

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
  async onStoreDocument({ documentName, document }) {
    const currentCount = editCounts.get(documentName) || 0;
    const newCount = currentCount + 1;
    editCounts.set(documentName, newCount);

    if (newCount % EDIT_COUNT_THRESHOLD === 0) {
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

      const currentIndex = currentVersionIndices.get(documentName);
      if (currentIndex !== undefined && currentIndex < versions.length - 1) {
        versions.splice(currentIndex + 1);
      }

      versions.push(version);
      currentVersionIndices.set(documentName, versions.length - 1);

      if (versions.length > 50) {
        versions.shift();
        const idx = currentVersionIndices.get(documentName);
        if (idx !== undefined && idx > 0) {
          currentVersionIndices.set(documentName, idx - 1);
        }
      }

      log.info(`Created snapshot ${version.id} for document ${documentName} (edit ${newCount})`);
    }
  },
});

const app = new Hono();

app.use('*', cors());

app.get('/api/versions/:documentName/status', async (c) => {
  const documentName = c.req.param('documentName');
  const versions = versionHistory.get(documentName) || [];
  const currentIndex = currentVersionIndices.get(documentName) ?? versions.length - 1;

  return c.json({
    canGoBack: currentIndex > 0,
    canGoForward: currentIndex < versions.length - 1 && currentIndex >= 0,
    currentIndex,
    totalVersions: versions.length,
  });
});

app.post('/api/versions/:documentName/back', async (c) => {
  const documentName = c.req.param('documentName');
  const versions = versionHistory.get(documentName) || [];
  let currentIndex = currentVersionIndices.get(documentName) ?? versions.length - 1;

  if (currentIndex <= 0) {
    return c.json({ error: 'Cannot go back' }, 400);
  }

  currentIndex -= 1;
  currentVersionIndices.set(documentName, currentIndex);

  const version = versions[currentIndex];
  if (!version) {
    return c.json({ error: 'Version not found' }, 404);
  }

  const doc = documentCache.get(documentName);
  if (!doc) {
    return c.json({ error: 'Document not found' }, 404);
  }

  Y.applyUpdate(doc, version.state);

  return c.json({ success: true, currentIndex });
});

app.post('/api/versions/:documentName/forward', async (c) => {
  const documentName = c.req.param('documentName');
  const versions = versionHistory.get(documentName) || [];
  let currentIndex = currentVersionIndices.get(documentName) ?? versions.length - 1;

  if (currentIndex >= versions.length - 1) {
    return c.json({ error: 'Cannot go forward' }, 400);
  }

  currentIndex += 1;
  currentVersionIndices.set(documentName, currentIndex);

  const version = versions[currentIndex];
  if (!version) {
    return c.json({ error: 'Version not found' }, 404);
  }

  const doc = documentCache.get(documentName);
  if (!doc) {
    return c.json({ error: 'Document not found' }, 404);
  }

  Y.applyUpdate(doc, version.state);

  return c.json({ success: true, currentIndex });
});

app.post('/api/versions/:documentName/commit', async (c) => {
  const documentName = c.req.param('documentName');
  const versions = versionHistory.get(documentName) || [];
  const currentIndex = currentVersionIndices.get(documentName);

  if (currentIndex === undefined || currentIndex < 0 || currentIndex >= versions.length) {
    return c.json({ error: 'No version to commit' }, 400);
  }

  const version = versions[currentIndex];
  if (!version) {
    return c.json({ error: 'Version not found' }, 404);
  }

  versions.splice(currentIndex + 1);
  currentVersionIndices.set(documentName, versions.length - 1);

  editCounts.set(documentName, 0);

  const doc = documentCache.get(documentName);
  if (doc && version) {
    Y.applyUpdate(doc, version.state);
  }

  return c.json({ success: true });
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

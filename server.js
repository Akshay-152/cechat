const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Serve static files (index.html, admin.html, sw.js)
app.use(express.static(path.join(__dirname, 'public')));


/*
  Setup:
  - Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
  - Export VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL (or replace defaults below)
*/
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BFac02acpDf3FjJIJCUwrRpSe9LWwW65O27NS5hZSCXBNVzhLG57y-m1anIEwTnjZz4X5iXCCj6CV8HTadydQpM';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '2u-Zbz7zyyh9udrQzjF3mXGDcPGwdkGmFyiBLEoMfgk';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:akshayganesh239@gmail.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

/* Init firebase-admin (uses GOOGLE_APPLICATION_CREDENTIALS env) */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}
const firestore = admin.firestore();

/* Helper: get all subscriptions or single by userId */
async function getAllSubscriptions() {
  const snap = await firestore.collection('push_subscriptions').get();
  const list = [];
  snap.forEach(doc => {
    const d = doc.data();
    if (d && d.subscription) list.push({ docId: doc.id, subscription: d.subscription });
  });
  return list;
}
async function getSubscriptionByUserId(userId) {
  const doc = await firestore.collection('push_subscriptions').doc(userId).get();
  if (!doc.exists) return null;
  const d = doc.data();
  return d.subscription || null;
}

/* Admin: list users */
app.get('/admin/list', async (req, res) => {
  try {
    const snap = await firestore.collection('push_subscriptions').get();
    const users = [];
    snap.forEach(d => {
      const data = d.data();
      users.push({
        userId: d.id,
        endpoint: data.subscription?.endpoint || null,
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
      });
    });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* Admin: send -> body: { title, body, url, target:'all'|'single', userId } */
app.post('/admin/send', async (req, res) => {
  const { title = 'Notification', body = '', url = '/', target = 'all', userId } = req.body;
  const payload = JSON.stringify({ title, body, url, msgId: 'm-' + Date.now() });

  try {
    let subs = [];
    if (target === 'single') {
      const s = await getSubscriptionByUserId(userId);
      if (s) subs.push({ docId: userId, subscription: s });
    } else {
      subs = await getAllSubscriptions();
    }
    if (!subs.length) return res.status(404).json({ error: 'no_subscriptions' });

    const results = await Promise.all(subs.map(async entry => {
      try {
        await webpush.sendNotification(entry.subscription, payload, { TTL: 24 * 3600 });
        return { ok: true, endpoint: entry.subscription.endpoint, userId: entry.docId || null };
      } catch (err) {
        if (entry.docId && (err.statusCode === 410 || err.statusCode === 404)) {
          await firestore.collection('push_subscriptions').doc(entry.docId).delete();
          return { ok: false, removed: true, endpoint: entry.subscription.endpoint, userId: entry.docId };
        }
        return { ok: false, endpoint: entry.subscription.endpoint, error: err.message || err };
      }
    }));

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* Optional: endpoint for client to ping server (health) */
app.get('/health', (req, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on', PORT));


        import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
        
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
  getDocs,
  writeBatch,
  deleteDoc,
  doc,
  updateDoc,
  getDoc, 
  setDoc,  
  limit

} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
        
        
        
        
        
        
        
        
        const firebaseConfig = {
            apiKey: "AIzaSyC-ft54KwehdTIsV93xBjLbd0nMeZ4ibDw",
            authDomain: "akshay-b744a.firebaseapp.com",
            projectId: "akshay-b744a",
            storageBucket: "akshay-b744a.firebasestorage.app",
            messagingSenderId: "752091661451",
            appId: "1:752091661451:web:7ccfa46feff8ce87c6808e",
            measurementId: "G-GKLRSSBRXR"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        
        
         
  // AI champion glow config
const AI_HIGHLIGHT_THRESHOLD = 5; // for testing; later you can set to 6
const AI_HIGHLIGHT_DURATION_MS = 1 * 1 * 10 * 1000; // 1 day      
        
const CLOUDINARY_CLOUD_NAME = "de7bwqvq5";
const CLOUDINARY_UPLOAD_PRESET = "myupload";


const avatarFileInput = document.getElementById("avatarFileInput");
const changeAvatarBtn  = document.getElementById("changeAvatarBtn");

let currentAvatarUrl = null;




        const MAX_MESSAGES_PER_DAY = 25;
        const MESSAGE_EXPIRY_DAYS = 1.5;

        const messagesContainer = document.getElementById('messagesContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const themeToggle = document.getElementById('themeToggle');
        const menuButton = document.getElementById('menuButton');
        const menuPanel = document.getElementById('menuPanel');
        const menuOverlay = document.getElementById('menuOverlay');
        const closeMenu = document.getElementById('closeMenu');
        const userNameInput = document.getElementById('userNameInput');
        const changeColorBtn = document.getElementById('changeColorBtn');
        const userColorBadge = document.getElementById('userColorBadge');
        const messageCount = document.getElementById('messageCount');
        const menuMessageCount = document.getElementById('menuMessageCount');
        const currentTime = document.getElementById('currentTime');
        const replyIndicator = document.getElementById('replyIndicator');
        const replyText = document.getElementById('replyText');
        const cancelReply = document.getElementById('cancelReply');
        const toast = document.getElementById('toast');
        const themeOptions = document.querySelectorAll('.theme-option');

        let userId = localStorage.getItem('userId') || generateUserId();
        let userName = localStorage.getItem('userName') || "You";
        let userColor = localStorage.getItem('userColor') || generateRandomColor();
        let messagesSentToday = 0;
        let replyingTo = null;
        let isInitialLoad = true;
        let existingMessageIds = new Set();

        function generateUserId() {
            const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', id);
            return id;
        }

        function generateRandomColor() {
            const colors = [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
                '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#F67280',
                '#C06C84', '#6C5B7B', '#355C7D', '#2ECC71', '#3498DB',
                '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12', '#D35400'
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }






        function updateUI() {
            userColorBadge.style.backgroundColor = userColor;
            document.getElementById('userName').textContent = userName;
            userNameInput.value = userName === "You" ? "" : userName;
        }

        function updateMessageCounter() {
            const count = `${messagesSentToday}/${MAX_MESSAGES_PER_DAY}`;
            messageCount.textContent = count;
            menuMessageCount.textContent = messagesSentToday;
        }

        function updateTime() {
            const now = new Date();
            currentTime.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }

        function loadMessageCount() {
            const data = localStorage.getItem('chatData');
            if (data) {
                const parsed = JSON.parse(data);
                const today = new Date().toDateString();
                if (parsed.date === today) {
                    messagesSentToday = parsed.count || 0;
                } else {
                    messagesSentToday = 0;
                    saveMessageCount();
                }
            }
            updateMessageCounter();
        }

        function saveMessageCount() {
            const today = new Date().toDateString();
            const data = { date: today, count: messagesSentToday };
            localStorage.setItem('chatData', JSON.stringify(data));
        }

        function canSendMessage() {
            if (messagesSentToday >= MAX_MESSAGES_PER_DAY) {
                showToast('Daily message limit reached (25 messages)');
                return false;
            }
            return true;
        }







async function sendMessage() {
  const messageText = messageInput.value.trim();
  if (!messageText) return;
  if (!canSendMessage()) return;

  // Check if current local userId is banned
  const localUserId = userId;
  const bannedNow = await isBanned(localUserId);
  if (bannedNow) {
    showToast('You are banned from sending messages (reported).');
    return;
  }

  const lower = messageText.toLowerCase();

  // 1) Special trigger: xox game
  if (lower === 'xox' || lower === '/xox') {
    try {
      await createXoxGameAndSendMessage();   // <-- new helper (step 4)
      messageInput.value = '';
      messageInput.style.height = 'auto';
      cancelReplyTo();
      messagesSentToday++;
      saveMessageCount();
      updateMessageCounter();
      scrollToBottom();
    } catch (err) {
      console.error('Error creating XOX game:', err);
      showToast('Error creating XOX game');
    }
    return;
  }

  // 2) Normal message (unchanged from your version)
  const message = {
    text: messageText,
    color: userColor,
    sender: userName === "You" ? "Anonymous" : userName,
    userId: userId,
    avatar: currentAvatarUrl || null,
    timestamp: serverTimestamp(),
    type: 'user',
    expiresAt: new Date(Date.now() + MESSAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    replyTo: replyingTo
  };

  try {
    await addDoc(collection(db, 'messages'), message);
    messageInput.value = '';
    messageInput.style.height = 'auto';
    cancelReplyTo();
    messagesSentToday++;
    saveMessageCount();
    updateMessageCounter();
    scrollToBottom();
  } catch (error) {
    console.error('Error sending message:', error);
    showToast('Error sending message');
  }
}




//  xox

async function createXoxGameAndSendMessage() {
  // 1. Create new game document
  const gameRef = await addDoc(collection(db, 'xoxGames'), {
    board: ['', '', '', '', '', '', '', '', ''],
    currentTurn: 'X',
    state: 'waiting',
    hostUid: userId,
    hostName: userName === "You" ? "Anonymous" : userName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messageId: null,
    aiEnabled: false,        // 👈 AI OFF by default
    aiSide: 'O'              // AI will play as O
  });

  // 2. Send a special chat message that references this game
  const gameMsgRef = await addDoc(collection(db, 'messages'), {
    text: 'XOX game invite',
    color: userColor,
    sender: userName === "You" ? "Anonymous" : userName,
    userId: userId,
    timestamp: serverTimestamp(),
    type: 'xoxGame',
    gameId: gameRef.id,
    expiresAt: new Date(Date.now() + MESSAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    replyTo: replyingTo
  });

  // 3. Store the messageId back into the game doc
  await updateDoc(gameRef, {
    messageId: gameMsgRef.id
  });
}


// ------------------- ONLINE PRESENCE (improved) -------------------

// Collection name for presence
const ONLINE_COLLECTION = 'onlineUsers';

// Heartbeat interval (ms) and offline cutoff (ms)
const HEARTBEAT_INTERVAL = 20_000; // 20s
const FORCED_HEARTBEAT = 120_000;  // force at least every 2min if nothing else
const OFFLINE_CUTOFF_MINUTES = 5;  // user considered offline after 5 minutes

let heartbeatIntervalHandle = null;
let forcedHeartbeatHandle = null;
let onlineQueryUnsub = null;
let presenceStarted = false;
let lastWriteAt = 0;

// ensure userId/userName/userColor exist (do NOT redeclare if already declared)
if (typeof userId === 'undefined' || !userId) {
  userId = localStorage.getItem('ak_presence_id_v1') || (crypto && crypto.randomUUID ? crypto.randomUUID() : 'g-' + Date.now());
  localStorage.setItem('ak_presence_id_v1', userId);
}
if (typeof userName === 'undefined' || !userName) {
  userName = localStorage.getItem('ak_presence_name') || ('Guest-' + String(userId).slice(0, 6));
  localStorage.setItem('ak_presence_name', userName);
}
if (typeof userColor === 'undefined' || !userColor) {
  userColor = '#333';
}

/** safe helper to get presence doc ref (modular Firestore) */
function presenceDocRef(uid = userId) {
  return doc(db, ONLINE_COLLECTION, String(uid));
}

/** Throttled presence write */
async function updatePresence(force = false) {
  try {
    const now = Date.now();
    if (!force) {
      // throttle normal writes
      if (now - lastWriteAt < HEARTBEAT_INTERVAL) {
        // but ensure we do a forced write occasionally
        if (now - lastWriteAt < FORCED_HEARTBEAT) return;
      }
    }
    lastWriteAt = now;

    await setDoc(presenceDocRef(), {
      userId: String(userId),
      name: userName === "You" ? "Anonymous" : String(userName),
      color: String(userColor),
      lastSeen: serverTimestamp()
    }, { merge: true });
    // console.debug('[presence] wrote presence at', new Date());
  } catch (err) {
    console.error('[presence] update error', err);
  }
}

/** Best-effort removal of presence doc (async; may fail during unload) */
function removePresence() {
  try {
    // call without awaiting in unload handlers to avoid blocking
    deleteDoc(presenceDocRef()).catch(() => {});
  } catch (err) {
    // ignore
  }
}

/** Start heartbeat + visibility handlers */
function startPresenceHeartbeat() {
  if (presenceStarted) return; // avoid double-starting
  presenceStarted = true;

  // initial immediate presence write (force)
  updatePresence(true);

  // regular heartbeat (throttled by updatePresence itself)
  heartbeatIntervalHandle = setInterval(() => updatePresence(), HEARTBEAT_INTERVAL);

  // ensure at least one forced write occasionally (in case of long inactivity in between)
  forcedHeartbeatHandle = setInterval(() => updatePresence(true), FORCED_HEARTBEAT);

  // try to remove presence on page close (best-effort)
  window.addEventListener('beforeunload', () => {
    // best-effort: attempt to delete presence doc (async)
    removePresence();
    // clear intervals to be tidy
    clearInterval(heartbeatIntervalHandle);
    clearInterval(forcedHeartbeatHandle);
    if (onlineQueryUnsub) {
      try { onlineQueryUnsub(); } catch (e) {}
    }
  });

  // update presence when tab visibility changes
  document.addEventListener('visibilitychange', () => {
    // write once on hidden or visible so lastSeen remains recent
    updatePresence(true);
  });

  // also update presence on page focus (useful when returning)
  window.addEventListener('focus', () => {
    updatePresence(true);
  });
}

/** Listen to online users and update UI safely.
 *  Uses a single onSnapshot listener that is replaced whenever the cutoff changes (every minute).
 */
function listenOnlineCount() {
  // clean up previous listener (if any)
  if (typeof onlineQueryUnsub === 'function') {
    try { onlineQueryUnsub(); } catch (e) {}
    onlineQueryUnsub = null;
  }

  // compute cutoff and set up a listener
  const setupListener = () => {
    // compute server-style cutoff using Firestore Timestamp.fromDate if available
    let cutoffDate = new Date(Date.now() - OFFLINE_CUTOFF_MINUTES * 60 * 1000);
    let cutoffValue;
    try {
      // prefer Timestamp if available (modular SDK)
      if (typeof Timestamp !== 'undefined' && Timestamp.fromDate) {
        cutoffValue = Timestamp.fromDate(cutoffDate);
      } else {
        // fallback to JS Date (compat accepts Date)
        cutoffValue = cutoffDate;
      }
    } catch (e) {
      cutoffValue = cutoffDate;
    }

    // build query
    const qOnline = query(
      collection(db, ONLINE_COLLECTION),
      where('lastSeen', '>', cutoffValue)
    );

    // attach snapshot listener (store unsubscribe)
    onlineQueryUnsub = onSnapshot(qOnline, (snap) => {
      const count = snap.size || 0;
      const onlineCountEl = document.getElementById('onlineCount');
      if (onlineCountEl) onlineCountEl.textContent = String(count);
    }, (err) => {
      console.error('[presence] online snapshot error', err);
    });
  };

  // setup initially
  setupListener();

  // Refresh the listener every minute so cutoff window slides correctly.
  // We detach previous listener then re-create it to update the query parameter.
  const refreshInterval = setInterval(() => {
    if (typeof onlineQueryUnsub === 'function') {
      try { onlineQueryUnsub(); } catch (e) {}
      onlineQueryUnsub = null;
    }
    setupListener();
  }, 60_000);

  // return cleanup function if needed
  return () => {
    clearInterval(refreshInterval);
    if (typeof onlineQueryUnsub === 'function') {
      try { onlineQueryUnsub(); } catch (e) {}
      onlineQueryUnsub = null;
    }
  };
}

// Initialize presence and listener
startPresenceHeartbeat();
const stopOnlineListener = listenOnlineCount();
// one more immediate presence write to be safe
updatePresence(true);

// -------------------------------------------------------------------------------------------------





        
        
        

        function loadMessages() {
            if (!document.querySelector('.system-message')) {
                const systemMsg = document.createElement('div');
                systemMsg.className = 'system-message';
                systemMsg.innerHTML = `<i class="fas fa-info-circle"></i> Your messages will be automatically deleted after 3 days`;
                messagesContainer.appendChild(systemMsg);
            }
            
            const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
            
            onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const message = change.doc.data();
                        const messageId = change.doc.id;
                        
                        if (!isMessageExpired(message)) {
                            const isNewMessage = !existingMessageIds.has(messageId) && !isInitialLoad;
                            existingMessageIds.add(messageId);
                            
                            if (isNewMessage) {
    displayMessage(message, messageId, true);
} else {
    displayMessage(message, messageId, false);
}                        }
                    }
                });
                
                if (isInitialLoad) {
                    isInitialLoad = false;
                    scrollToBottom();
                }
            });
        }
        
        
        
//        scrollToBottom(); hsndnmdjsjdjdjsjsjsn




function displayMessage(message, messageId, isNewMessage = false) {

    // ------------------ EXPIRY HANDLING ------------------
    if (isMessageExpired(message)) {

        // 1. Delete linked XOX game if this is an XOX game message
        if (message.type === "xoxGame" && message.gameId) {
            deleteDoc(doc(db, "xoxGames", message.gameId))
                .catch(err => console.warn("Failed to delete expired game:", err));
        }

        // 2. Delete the expired chat message itself
        deleteDoc(doc(db, "messages", messageId))
            .catch(err => console.warn("Failed to delete expired message:", err));

        return;  // important: do not render expired messages
    }
    // ------------------------------------------------------

    const messageDiv = document.createElement('div');
    const isCurrentUser = message.userId === userId;

    // ✅ AI champion glow – global-safe:
    // - If you are using xoxHighlightUsers (global map), this will use it.
    // - If not defined, it safely does nothing.
    let hasAiHighlight = false;
    const nowMs = Date.now();
    if (typeof xoxHighlightUsers !== "undefined" && message.userId) {
        if (
            xoxHighlightUsers[message.userId] &&
            xoxHighlightUsers[message.userId] > nowMs
        ) {
            hasAiHighlight = true;
        }
    } else if (isCurrentUser) {
        // fallback: localStorage-based (if you still use it)
        const untilStr = localStorage.getItem('xoxAiChampionUntil');
        if (untilStr) {
            const untilMs = Number(untilStr);
            if (!Number.isNaN(untilMs) && untilMs > Date.now()) {
                hasAiHighlight = true;
            }
        }
    }

    messageDiv.className = `message ${isCurrentUser ? 'user-message' : 'other-message'} ${isNewMessage ? 'new-message' : ''}`;
    messageDiv.dataset.messageId = messageId;
    messageDiv.id = `message-${messageId}`;

    const timestamp = message.timestamp
        ? message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let replySection = '';
    if (message.replyTo) {
        const repliedMessage = message.replyTo;
        replySection = `
            <div class="reply-preview">
                <div class="reply-sender" style="color: rgba(255,255,255,0.9)">
                    <i class="fas fa-reply"></i> ${repliedMessage.sender || 'Anonymous'}
                </div>
                ${repliedMessage.text}
            </div>
        `;
    }

    // ---------- Styles + sender name ----------
    let messageStyle;
    let senderNameStyle = '';
    let displaySenderName = message.sender || 'Anonymous';

    if (message.sender === 'cecchatadmine1') {
        // ADMIN style (no AI highlight here)
        displaySenderName = 'ADMIN';
        messageStyle = 'background: black !important; color: white !important; box-shadow: 0 0 12px rgba(255,255,255,0.6);';
        senderNameStyle = 'color: white !important; font-size: 1.1rem; font-weight: 700; text-shadow: 0 0 8px rgba(255,255,255,0.8);';
    } else {
        // Normal user base color
        messageStyle = `background: ${message.color} !important;`;

        // 🔥 Extra dynamic style if this user has AI champion highlight
        if (hasAiHighlight) {
            // You can change label; this only affects display, not stored sender
            displaySenderName = `${displaySenderName} · XOX 👑`;
            messageStyle += `
                background: linear-gradient(135deg,
                  rgba(249,115,22,0.95),
                  rgba(236,72,153,0.95),
                  rgba(56,189,248,0.95)
                ) !important;
                box-shadow: 0 0 18px rgba(236,72,153,0.8);
                border: 1px solid rgba(248,250,252,0.9);
            `;
        }
    }

    // ---------- Avatar HTML (profile picture) ----------
    let avatarHtml = '';
    if (message.avatar) {
        // Cloudinary image or any URL
        avatarHtml = `<img class="message-avatar" src="${message.avatar}" alt="avatar">`;
    } else {
        // Optional placeholder with first letter
        const initial = displaySenderName.trim().charAt(0).toUpperCase();
        avatarHtml = `<div class="message-avatar placeholder">${initial}</div>`;
    }

    // ---------- Main content ----------
    let mainContentHtml = '';

    if (message.type === 'xoxGame' && message.gameId) {
        // XOX game card instead of plain text
        mainContentHtml = `
          <div class="xox-card" data-game-id="${message.gameId}">
            <div class="xox-title">XOX Game Invite</div>
            <div class="xox-meta">
              Host: ${displaySenderName}<br>
              <span id="xox-status-${messageId}">Waiting for opponent...</span>
            </div>
            <button class="xox-open-btn" data-game-id="${message.gameId}">
              ${isCurrentUser ? 'Open game' : 'Join game'}
            </button>
          </div>
        `;
    } else {
        // normal text message
        mainContentHtml = `<div class="message-text">${message.text}</div>`;
    }

    // ---------- Final bubble HTML ----------
    messageDiv.innerHTML = `
        <div class="message-bubble" style="${messageStyle}" data-message-id="${messageId}">
            ${!isCurrentUser ? `
                <div class="message-sender" style="${senderNameStyle}">
                    ${avatarHtml}
                    <span class="sender-color" style="background-color: ${message.color}"></span>
                    ${displaySenderName}
                </div>
            ` : ''}
            ${replySection}
            ${mainContentHtml}
            <div class="message-time">
                ${timestamp}
            </div>
        </div>
    `;

    // ---------- XOX game button wiring ----------
    if (message.type === 'xoxGame' && message.gameId) {
        const btn = messageDiv.querySelector('.xox-open-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // do not trigger reply
                openXoxGameOverlay(message.gameId);
            });
        }
    }

    // ---------- Reply on click ----------
    const bubble = messageDiv.querySelector('.message-bubble');
    bubble.addEventListener('click', () => {
        replyToMessage(messageId, message.text, message.color, message.sender);
    });

    // ---------- Long-press for admin ----------
    let longPressTimer = null;

    const startPress = (ev) => {
        // admin check: either runtime userName or stored localStorage userName
        const storedName = localStorage.getItem('userName');
        if (userName !== 'cecchatadmine1' && storedName !== 'cecchatadmine1') return;

        longPressTimer = setTimeout(() => {
            let x = (ev.touches && ev.touches[0]) ? ev.touches[0].clientX : ev.clientX;
            let y = (ev.touches && ev.touches[0]) ? ev.touches[0].clientY : ev.clientY;

            showAdminMenuAt(x, y, {
                onDelete: () => deleteMessage(messageId),
                onReport: () => reportSender(message.userId)
            });
        }, 1000); // 1 second
    };

    const cancelPress = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    };

    // Mouse
    bubble.addEventListener('mousedown', startPress);
    bubble.addEventListener('mouseup', cancelPress);
    bubble.addEventListener('mouseleave', cancelPress);

    // Touch
    bubble.addEventListener('touchstart', startPress);
    bubble.addEventListener('touchend', cancelPress);
    bubble.addEventListener('touchcancel', cancelPress);

    messagesContainer.appendChild(messageDiv);
}


setupXoxHostActivityListener();


// ---------------- Admin helpers: menu, delete, report, ban check ----------------

// Returns true if the current local user is admin
function isCurrentUserAdmin() {
  const storedName = localStorage.getItem('userName');
  return userName === 'cecchatadmine1' || storedName === 'cecchatadmine1';
}

// Create & show admin menu near the pointer (x,y). handlers: { onDelete, onReport }
function showAdminMenuAt(x, y, handlers = {}) {
  // remove old menu if present
  const existing = document.getElementById('adminActionMenu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'adminActionMenu';
  menu.style.position = 'fixed';
  menu.style.left = (x + 6) + 'px';
  menu.style.top = (y + 6) + 'px';
  menu.style.zIndex = 2000;
  menu.style.padding = '8px';
  menu.style.borderRadius = '8px';
  menu.style.background = 'var(--secondary-bg)';
  menu.style.color = 'var(--text-color)';
  menu.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';
  menu.style.display = 'flex';
  menu.style.flexDirection = 'column';
  menu.style.gap = '6px';
  menu.style.minWidth = '140px';
  menu.style.border = '1px solid var(--border-color)';

  const createBtn = (text) => {
    const b = document.createElement('button');
    b.textContent = text;
    b.style.padding = '8px';
    b.style.border = 'none';
    b.style.cursor = 'pointer';
    b.style.borderRadius = '6px';
    b.style.fontWeight = '700';
    b.style.background = 'transparent';
    b.style.textAlign = 'left';
    b.addEventListener('mouseover', () => b.style.background = 'rgba(0,0,0,0.06)');
    b.addEventListener('mouseout', () => b.style.background = 'transparent');
    return b;
  };

  const delBtn = createBtn('Delete');
  delBtn.addEventListener('click', () => { if (handlers.onDelete) handlers.onDelete(); menu.remove(); });

  const repBtn = createBtn('Report (ban 1 day)');
  repBtn.addEventListener('click', () => { if (handlers.onReport) handlers.onReport(); menu.remove(); });

  const cancelBtn = createBtn('Cancel');
  cancelBtn.addEventListener('click', () => menu.remove());

  menu.appendChild(delBtn);
  menu.appendChild(repBtn);
  menu.appendChild(cancelBtn);

  document.body.appendChild(menu);

  // click-away removes menu
  const clickAway = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      window.removeEventListener('pointerdown', clickAway);
    }
  };
  window.addEventListener('pointerdown', clickAway);
}

// Delete message doc from Firestore
async function deleteMessage(messageId) {
  if (!messageId) return;
  const ok = confirm('Delete this message? This action cannot be undone.');
  if (!ok) return;
  try {
    await deleteDoc(doc(db, 'messages', messageId));
    showToast('Message deleted');
  } catch (err) {
    console.error('deleteMessage error', err);
    showToast('Failed to delete message');
  }
}

// Report sender: ban userId for 24 hours (create/update doc in bannedUsers collection)
async function reportSender(userId) {
  if (!userId) {
    showToast('Cannot report: no user id');
    return;
  }
  const ok = confirm('Report this sender. They will be blocked for 24 hours. Continue?');
  if (!ok) return;
  try {
    const banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await setDoc(doc(db, 'bannedUsers', userId), {
      bannedUntil: banUntil
    });
    showToast('Sender reported and banned for 24 hours');
  } catch (err) {
    console.error('reportSender error', err);
    showToast('Failed to report sender');
  }
}

// Check if a given userId is currently banned
async function isBanned(userId) {
  if (!userId) return false;
  try {
    const d = await getDoc(doc(db, 'bannedUsers', userId));
    if (!d.exists()) return false;
    const data = d.data();
    const bannedUntil = data && data.bannedUntil ? (data.bannedUntil.toDate ? data.bannedUntil.toDate() : new Date(data.bannedUntil)) : null;
    if (!bannedUntil) return false;
    return new Date() < bannedUntil;
  } catch (err) {
    console.error('isBanned error', err);
    return false;
  }
}







        function replyToMessage(messageId, text, color, sender) {
            replyingTo = {
                messageId: messageId,
                text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                color: color,
                sender: sender || 'Anonymous'
            };
            
            replyText.textContent = replyingTo.text;
            replyIndicator.style.display = 'flex';
            messageInput.focus();
            closeMenuPanel();
        }

        function cancelReplyTo() {
            replyingTo = null;
            replyIndicator.style.display = 'none';
        }

        function isMessageExpired(message) {
            if (!message.expiresAt) return false;
            const expiryDate = message.expiresAt.toDate ? 
                message.expiresAt.toDate() : new Date(message.expiresAt);
            return new Date() > expiryDate;
        }

        function getExpiryInfo(message) {
            if (!message.expiresAt) return '';
            
            const expiryDate = message.expiresAt.toDate ? 
                message.expiresAt.toDate() : new Date(message.expiresAt);
            const timeLeft = expiryDate - new Date();
            const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
            
            if (daysLeft <= 0) {
                return '<div class="expired-badge">Expired</div>';
            } else if (daysLeft === 1) {
                return '<div style="font-size: 0.65rem; opacity: 0.7;">Expires tomorrow</div>';
            } else {
                return `<div style="font-size: 0.65rem; opacity: 0.7;">Expires in ${daysLeft} days</div>`;
            }
        }

        async function cleanExpiredMessages() {
            const threeDaysAgo = new Date(Date.now() - MESSAGE_EXPIRY_DAYS *24*60*60*1000);
            
            try {
                const q = query(collection(db, 'messages'), where('timestamp', '<', threeDaysAgo));
                const snapshot = await getDocs(q);
                
                const batch = writeBatch(db);
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                await batch.commit();
            } catch (error) {
                console.error('Error cleaning expired messages:', error);
            }
        }

        function scrollToBottom() {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }

        function showToast(message) {
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        function openMenu() {
            menuPanel.classList.add('active');
            menuOverlay.style.display = 'block';
            setTimeout(() => menuOverlay.style.opacity = '1', 10);
        }

        function closeMenuPanel() {
            menuPanel.classList.remove('active');
            menuOverlay.style.opacity = '0';
            setTimeout(() => menuOverlay.style.display = 'none', 300);
        }

        function setTheme(theme) {
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('chatTheme', theme);
            updateThemeIcon(theme);
        }

        function updateActiveThemeOption(theme) {
            themeOptions.forEach(option => {
                option.classList.remove('active');
                if (option.dataset.theme === theme) {
                    option.classList.add('active');
                }
            });
        }

        function toggleTheme() {
            const currentTheme = document.body.getAttribute('data-theme') || 'light';
            const themes = ['light', 'dark', 'ocean', 'sunset', 'forest'];
            const currentIndex = themes.indexOf(currentTheme);
            const nextIndex = (currentIndex + 1) % themes.length;
            const newTheme = themes[nextIndex];
            
            setTheme(newTheme);
            updateActiveThemeOption(newTheme);
            showToast(`Theme: ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)}`);
        }

        function updateThemeIcon(theme) {
            const icon = themeToggle.querySelector('i');
            const icons = {
                'light': 'fa-sun',
                'dark': 'fa-moon',
                'ocean': 'fa-water',
                'sunset': 'fa-cloud-sun',
                'forest': 'fa-tree'
            };
            icon.className = `fas ${icons[theme] || 'fa-palette'}`;
        }


function updateUserName(e) {
  userName = e.target.value.trim() || "You";
  localStorage.setItem('userName', userName);
  updateUI();
  showToast(`Name set to ${userName}`);
}

                
        
        

        function changeUserColor() {
            userColor = generateRandomColor();
            localStorage.setItem('userColor', userColor);
            updateUI();
            showToast('Color changed!');
        }

        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 130) + 'px';
        });

        messageInput.addEventListener('focus', function() {
            messagesContainer.classList.add('keyboard-open');
            setTimeout(() => scrollToBottom(), 300);
        });

        messageInput.addEventListener('blur', function() {
            messagesContainer.classList.remove('keyboard-open');
        });

        window.addEventListener('resize', function() {
            if (document.activeElement === messageInput) {
                setTimeout(() => scrollToBottom(), 100);
            }
        });

        themeToggle.addEventListener('click', toggleTheme);
        menuButton.addEventListener('click', openMenu);
        closeMenu.addEventListener('click', closeMenuPanel);
        menuOverlay.addEventListener('click', closeMenuPanel);
        userNameInput.addEventListener('input', updateUserName);
        changeColorBtn.addEventListener('click', changeUserColor);
        cancelReply.addEventListener('click', cancelReplyTo);

        themeOptions.forEach(option => {
            option.addEventListener('click', function() {
                const theme = this.dataset.theme;
                setTheme(theme);
                themeOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                closeMenuPanel();
            });
        });

        updateUI();
        loadMessageCount();
        updateTime();
        setInterval(updateTime, 1000);

        const savedTheme = localStorage.getItem('chatTheme') || 'light';
        setTheme(savedTheme);
        updateActiveThemeOption(savedTheme);

        loadMessages();
        
        setInterval(cleanExpiredMessages, 60 * 60 * 1000);
        
        
        
        
        
        
        
        
        
 // ---------------- CE COIN (generate every 3 minutes and add to Firestore) ----------------
import {
  doc as firestoreDoc,
  onSnapshot as onDocSnapshot,
  runTransaction
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// ensure ceCoin element exists in DOM
const ceCoinEl = document.getElementById('ceCoin');

// helper: random 1-8 inclusive
function generateRandomCoin() {
  return Math.floor(Math.random() * 8) + 1;
}

// atomically add random value to user's coin field using a transaction
async function addRandomCoinToFirestore() {
  if (!userId) return;
  const ref = firestoreDoc(db, 'coin', String(userId));
  const randomVal = generateRandomCoin();

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const current = (snap.exists() && Number(snap.data().coin)) || 0;
      const newVal = current + randomVal;

      tx.set(ref, {
        userId: String(userId),
        userName: userName === "You" ? "Anonymous" : String(userName),
        coin: newVal,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // update UI immediately inside transaction flow (not required but helpful)
      if (ceCoinEl) ceCoinEl.textContent = String(newVal);
    });

    // optional toast to show how much was added
    // showToast(`+${randomVal} coins added`);
    return true;
  } catch (err) {
    console.error('addRandomCoinToFirestore error', err);
    showToast('Failed to add coin');
    return false;
  }
}

// Listener: keep UI in sync if coin doc changes in Firestore
function listenToMyCoinDoc() {
  if (!userId) return;
  const myCoinDocRef = firestoreDoc(db, 'coin', String(userId));
  try {
    onDocSnapshot(myCoinDocRef, (snap) => {
      if (!snap.exists()) {
        if (ceCoinEl) ceCoinEl.textContent = '-';
        return;
      }
      const data = snap.data();
      if (data && typeof data.coin !== 'undefined') {
        if (ceCoinEl) ceCoinEl.textContent = String(data.coin);
      }
    }, (err) => {
      console.error('coin doc snapshot error', err);
    });
  } catch (e) {
    console.error('listenToMyCoinDoc error', e);
  }
}

// Start coin generation and listening:
// generate immediately and then every 3 minutes (180000 ms)
function startCoinRoutine() {
  // ensure UI listener active
  listenToMyCoinDoc();

  // initial add on load
  addRandomCoinToFirestore();

  // schedule every 3 minutes (180,000 ms)
  setInterval(() => {
    addRandomCoinToFirestore();
  }, 5 * 60 * 1000); // 5. minutes
}

// start when app has initialized userId etc.
// call this near the end of your init code
startCoinRoutine();        
     
   
   
   

const reduceBtn = document.getElementById('reduceMsgBtn');

reduceBtn.addEventListener('click', handleReduceMessages);

async function handleReduceMessages() {
  if (!userId) { showToast("Sign in to use coins."); return; }

  // disable while processing
  reduceBtn.disabled = true;

  try {
    // --- 1) Read coin doc ---
    const coinRef = firestoreDoc(db, 'coin', String(userId));
    const coinSnap = await getDoc(coinRef);
    const coins = (coinSnap.exists() && Number(coinSnap.data().coin)) || 0;

    if (coins < 5) {
      showToast('Not enough coins. Need 5 coins.');
      reduceBtn.disabled = false;
      return;
    }

    // --- 2) Deduct 5 coins. (Simple read->write; not strictly atomic) ---
    const newCoinVal = Math.max(0, coins - 5);
    await setDoc(coinRef, { coin: newCoinVal, updatedAt: serverTimestamp() }, { merge: true });

    // Update coin UI if present
    if (ceCoinEl) ceCoinEl.textContent = String(newCoinVal);

    // --- 3) Reduce local message counter by 10 and persist ---
    messagesSentToday = Math.max(0, Number(messagesSentToday || 0) - 10);
    saveMessageCount();         // saves to localStorage
    updateMessageCounter();     // updates UI elements (messageCount/menuMessageCount)

    showToast('Messages reduced by 10 (Cost 5 coins).');

  } catch (err) {
    console.error('handleReduceMessages error:', err);
    showToast('Error reducing messages. Try again.');
  } finally {
    reduceBtn.disabled = false;
  }
}





// ------------- XOX GAME LOGIC -------------

let currentXoxGameId = null;
let xoxUnsub = null;
let xoxMyRole = null; // 'X', 'O', 'spectator'
let xoxLocalBoard = ['', '', '', '', '', '', '', '', ''];

const xoxOverlay = document.getElementById('xoxOverlay');
const xoxBoardEl = document.getElementById('xoxBoard');
const xoxMyRoleEl = document.getElementById('xoxMyRole');
const xoxTurnEl = document.getElementById('xoxTurn');
const xoxStatusBar = document.getElementById('xoxStatusBar');
const xoxCloseBtn = document.getElementById('xoxCloseBtn');
const xoxResetBtn = document.getElementById('xoxResetBtn');

const xoxAiBtn = document.getElementById('xoxAiBtn');

const xoxAiEnableBtn = document.getElementById('xoxAiEnableBtn');
const xoxAiDisableBtn = document.getElementById('xoxAiDisableBtn');





// open overlay + join if needed + start listening
async function openXoxGameOverlay(gameId) {
  currentXoxGameId = gameId;
  xoxOverlay.classList.remove("hidden");
  xoxStatusBar.textContent = "Connecting to game...";

  // ✅ If this game triggered the indicator, hide it now
  if (xoxHostIndicatorGameId === gameId) {
    xoxHostIndicator.classList.add("hidden");
  }

  await joinXoxGameIfNeeded(gameId);
  subscribeXoxGame(gameId);
}



// close overlay and stop listening
function closeXoxGameOverlay() {
  if (xoxUnsub) {
    xoxUnsub();
    xoxUnsub = null;
  }
  currentXoxGameId = null;
  xoxOverlay.classList.add('hidden');
}

xoxCloseBtn.addEventListener('click', closeXoxGameOverlay);





if (xoxAiEnableBtn) {
  xoxAiEnableBtn.addEventListener('click', async () => {
    if (!currentXoxGameId) return;
    const gameRef = doc(db, 'xoxGames', currentXoxGameId);
    try {
      await updateDoc(gameRef, {
        aiEnabled: true,
        aiSide: 'O',
        updatedAt: serverTimestamp()
      });
      xoxStatusBar.textContent = 'AI enabled (O).';
    } catch (err) {
      console.error('Enable AI error:', err);
    }
  });
}

if (xoxAiDisableBtn) {
  xoxAiDisableBtn.addEventListener('click', async () => {
    if (!currentXoxGameId) return;
    const gameRef = doc(db, 'xoxGames', currentXoxGameId);
    try {
      await updateDoc(gameRef, {
        aiEnabled: false,
        updatedAt: serverTimestamp()
      });
      xoxStatusBar.textContent = 'AI disabled.';
    } catch (err) {
      console.error('Disable AI error:', err);
    }
  });
}






// subscribe to game doc


// subscribe to game doc
function subscribeXoxGame(gameId) {
  const gameRef = doc(db, 'xoxGames', gameId);

  // Unsubscribe from any previous game listener
  if (xoxUnsub) xoxUnsub();

  xoxUnsub = onSnapshot(
    gameRef,
    (snap) => {
      if (!snap.exists()) {
        xoxStatusBar.textContent = 'Game not found or deleted.';
        return;
      }

      const data = snap.data();

      // Decide my role: host = X, others = O
      const isHost = data.hostUid === userId;
      xoxMyRole = isHost ? 'X' : 'O';
      xoxMyRoleEl.textContent = xoxMyRole;

      // Board and win check
      const board = Array.isArray(data.board)
        ? data.board
        : ['', '', '', '', '', '', '', '', ''];

      xoxLocalBoard = board.slice();

      const winCombo = checkXoxWin(board);
      renderXoxBoard(board, winCombo);
      
      // If AI game finished, handle local reward for host
    if (data.state === 'finished') {
      handleLocalAiGameFinished(board, data);
    }

      // 🔹 AI buttons visibility (host only)
      if (xoxAiEnableBtn && xoxAiDisableBtn) {
        if (isHost && data.state !== 'finished' && data.state !== 'draw') {
          if (data.aiEnabled) {
            // AI ON → show Disable, hide Enable
            xoxAiDisableBtn.classList.remove('hidden');
            xoxAiEnableBtn.classList.add('hidden');
          } else {
            // AI OFF → show Enable, hide Disable
            xoxAiEnableBtn.classList.remove('hidden');
            xoxAiDisableBtn.classList.add('hidden');
          }
        } else {
          // Not host OR game ended → hide both
          xoxAiEnableBtn.classList.add('hidden');
          xoxAiDisableBtn.classList.add('hidden');
        }
      }

      // 🔹 If AI is enabled and it's AI's turn (O), let host's client make AI move
      if (data.aiEnabled && data.state === 'playing' && isHost) {
        if (data.currentTurn === 'O' && data.aiSide === 'O') {
          setTimeout(() => {
            makeXoxAiMove(snap.id);
          }, 400); // small delay for natural feel
        }
      }

      // Status bar text
      if (data.state === 'waiting') {
        xoxStatusBar.textContent = 'Waiting for another player to join...';
      } else if (data.state === 'playing') {
        xoxStatusBar.textContent = data.aiEnabled
          ? `AI active. Turn: ${data.currentTurn}`
          : `Turn: ${data.currentTurn}`;
      } else if (data.state === 'finished') {
        xoxStatusBar.textContent = `Player ${
          data.currentTurn === 'X' ? 'O' : 'X'
        } won!`;
      } else if (data.state === 'draw') {
        xoxStatusBar.textContent = 'Game ended in a draw.';
      }
    },
    (err) => {
      console.error('XOX snapshot error:', err);
      xoxStatusBar.textContent = 'Error reading game.';
    }
  );
}



// First joiner becomes guest
async function joinXoxGameIfNeeded(gameId) {
  const gameRef = doc(db, 'xoxGames', gameId);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef);
      if (!snap.exists()) return;
      const data = snap.data();

      // If there is no guest yet and we are not host, become guest
      if (!data.guestUid && data.hostUid !== userId) {
        tx.update(gameRef, {
          guestUid: userId,
          guestName: userName === "You" ? "Anonymous" : userName,
          state: 'playing',
          updatedAt: serverTimestamp()
        });
      }
    });
  } catch (err) {
    console.error('joinXoxGameIfNeeded error:', err);
  }
}



// render board to overlay
function renderXoxBoard(board, winCombo) {
  const cells = xoxBoardEl.querySelectorAll('.xox-cell');
  cells.forEach((cell, idx) => {
    const val = board[idx] || '';
    cell.textContent = val;
    cell.classList.remove('x', 'o', 'winning');
    if (val === 'X') cell.classList.add('x');
    if (val === 'O') cell.classList.add('o');
    if (winCombo && winCombo.includes(idx)) {
      cell.classList.add('winning');
    }
  });
}

// check winner (same idea as game1.html)
function checkXoxWin(board) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const c of combos) {
    const [a,b,c2] = c;
    if (board[a] && board[a] === board[b] && board[a] === board[c2]) {
      return c;
    }
  }
  return null;
}

// handle cell clicks
xoxBoardEl.querySelectorAll('.xox-cell').forEach((cell) => {
  cell.addEventListener('click', () => {
    const index = parseInt(cell.getAttribute('data-index'), 10);
    handleXoxCellClick(index);
  });
});




async function handleXoxCellClick(index) {
  if (!currentXoxGameId) return;

  const gameRef = doc(db, "xoxGames", currentXoxGameId);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef);
      if (!snap.exists()) throw new Error("Game missing");

      const data = snap.data();

      if (data.state === "finished" || data.state === "draw") {
        throw new Error("Game already finished");
      }

      const board = Array.isArray(data.board)
        ? data.board.slice()
        : ["", "", "", "", "", "", "", "", ""];

      if (board[index]) throw new Error("Cell already taken");

      const currentTurn = data.currentTurn || "X";
      const isHost = data.hostUid === userId;

      if (currentTurn === "X" && !isHost) {
        throw new Error("Only the host can play X.");
      }
      if (currentTurn === "O" && isHost) {
        throw new Error("Host cannot play O.");
      }

      board[index] = currentTurn;

      const winCombo = checkXoxWin(board);
      let newState = data.state;
      let nextTurn = currentTurn === "X" ? "O" : "X";

      if (winCombo) {
        newState = "finished";
      } else if (!board.includes("")) {
        newState = "draw";
      } else {
        newState = "playing";
      }

      tx.update(gameRef, {
        board: board,
        currentTurn: nextTurn,
        state: newState,
        updatedAt: serverTimestamp()
      });
    });
  } catch (err) {
    console.warn("handleXoxCellClick error:", err.message || err);
  }
}


// Reset round: clear board but keep same host/guest
xoxResetBtn.addEventListener('click', async () => {
  if (!currentXoxGameId) return;
  const gameRef = doc(db, 'xoxGames', currentXoxGameId);

  try {
    await updateDoc(gameRef, {
      board: ['', '', '', '', '', '', '', '', ''],
      currentTurn: 'X',
      state: 'playing',
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error('xox reset error:', err);
  }
});


// Game button to automatically send "xox"
const gameXoxBtn = document.getElementById("gameXoxBtn");

if (gameXoxBtn) {
  gameXoxBtn.addEventListener("click", () => {
    messageInput.value = "xox";   // fill the input box
    sendMessage();                // call the same send function
  });
}



const xoxHostIndicator = document.getElementById('xoxHostIndicator');
let xoxHostIndicatorMessageId = null;
let xoxHostIndicatorGameId = null;

// Remember last board state we already notified about for each game
const xoxLastNotifiedBoard = {};

 


if (xoxHostIndicator) {
  xoxHostIndicator.addEventListener('click', () => {
    if (xoxHostIndicatorMessageId) {
      scrollToMessage(xoxHostIndicatorMessageId);
    }
    xoxHostIndicator.classList.add('hidden');
  });
}




function setupXoxHostActivityListener() {
  const q = query(
    collection(db, "xoxGames"),
    where("hostUid", "==", userId)
  );

  onSnapshot(q, (snapshot) => {
    let latest = null;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data || !data.messageId) return;

      const board = Array.isArray(data.board) ? data.board : [];
      const hasMoves = board.some(cell => !!cell);
      if (!hasMoves) return;               // no one has played yet
      if (data.state !== "playing") return; // ignore finished / draw games

      // 👉 Figure out who played last:
      // if currentTurn = 'X', last move was 'O'
      // if currentTurn = 'O', last move was 'X'
      const lastMove = data.currentTurn === "X" ? "O" : "X";

      // ✅ Only trigger indicator when last move was by O (other users)
      if (lastMove !== "O") return;

      const boardKey = board.join(""); // compact string of board state

      // If we've already shown indicator for this exact board, skip
      if (xoxLastNotifiedBoard[docSnap.id] === boardKey) return;

      const updatedAt = data.updatedAt && data.updatedAt.toMillis
        ? data.updatedAt.toMillis()
        : 0;

      if (!latest || updatedAt > latest.updatedAt) {
        latest = {
          gameId: docSnap.id,
          messageId: data.messageId,
          updatedAt,
          boardKey
        };
      }
    });

    if (latest) {
      // Save so we don't notify again until board changes
      xoxHostIndicatorMessageId = latest.messageId;
      xoxHostIndicatorGameId = latest.gameId;
      xoxLastNotifiedBoard[latest.gameId] = latest.boardKey;

      xoxHostIndicator.classList.remove("hidden");
    } else {
      xoxHostIndicatorMessageId = null;
      xoxHostIndicatorGameId = null;
      xoxHostIndicator.classList.add("hidden");
    }
  }, (err) => {
    console.error("XOX host activity listener error:", err);
  });
}



function scrollToMessage(messageId) {
  const el = document.getElementById(`message-${messageId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('highlight-message');
    setTimeout(() => el.classList.remove('highlight-message'), 1500);
  }
}




//ai xox

if (xoxAiBtn) {
  xoxAiBtn.addEventListener('click', async () => {
    if (!currentXoxGameId) return;

    const gameRef = doc(db, 'xoxGames', currentXoxGameId);

    try {
      await updateDoc(gameRef, {
        aiEnabled: true,
        aiSide: 'O',
        updatedAt: serverTimestamp()
      });
      xoxStatusBar.textContent = 'AI enabled as O. You are X.';
    } catch (err) {
      console.error('Enable AI error:', err);
    }
  });
}
        
        
        
async function makeXoxAiMove(gameId) {
  const gameRef = doc(db, 'xoxGames', gameId);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef);
      if (!snap.exists()) return;
      const data = snap.data();

      // Only if AI is ON and it's O's turn
      if (!data.aiEnabled || data.state !== 'playing') return;
      if (data.currentTurn !== 'O' || data.aiSide !== 'O') return;

      const board = Array.isArray(data.board)
        ? data.board.slice()
        : ['', '', '', '', '', '', '', '', ''];

      const aiIndex = chooseAiMoveIndex(board, 'O', 'X');
      if (aiIndex === -1) return; // no move available

      board[aiIndex] = 'O';

      const winCombo = checkXoxWin(board);
      let newState = data.state;
      let nextTurn = 'X';

      if (winCombo) {
        newState = 'finished';
      } else if (!board.includes('')) {
        newState = 'draw';
      } else {
        newState = 'playing';
        nextTurn = 'X';
      }

      tx.update(gameRef, {
        board: board,
        currentTurn: nextTurn,
        state: newState,
        updatedAt: serverTimestamp()
      });
    });
  } catch (err) {
    console.error('makeXoxAiMove error:', err);
  }
}

function chooseAiMoveIndex(board, ai, opp) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  // 1) Try to win
  for (const [a,b,c] of lines) {
    const line = [board[a], board[b], board[c]];
    if (line.filter(v => v === ai).length === 2 && line.includes('')) {
      if (board[a] === '') return a;
      if (board[b] === '') return b;
      if (board[c] === '') return c;
    }
  }

  // 2) Block opponent from winning
  for (const [a,b,c] of lines) {
    const line = [board[a], board[b], board[c]];
    if (line.filter(v => v === opp).length === 2 && line.includes('')) {
      if (board[a] === '') return a;
      if (board[b] === '') return b;
      if (board[c] === '') return c;
    }
  }

  // 3) Take center
  if (board[4] === '') return 4;

  // 4) Take a corner
  const corners = [0,2,6,8].filter(i => board[i] === '');
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  // 5) Take any side
  const sides = [1,3,5,7].filter(i => board[i] === '');
  if (sides.length) return sides[Math.floor(Math.random() * sides.length)];

  return -1;
}


        
        
        
        
        
function handleLocalAiGameFinished(board, data) {
  // Only care about AI games
  if (!data.aiEnabled) return;

  const winCombo = checkXoxWin(board);
  if (!winCombo) return;

  const winnerSymbol = board[winCombo[0]]; // 'X' or 'O'
  const isHost = data.hostUid === userId;

  // We only reward: host (X) beating AI (O)
  if (!isHost || winnerSymbol !== 'X') return;

  // Read current local wins
  let wins = parseInt(localStorage.getItem('xoxAiWins') || '0', 10);
  wins++;
  localStorage.setItem('xoxAiWins', String(wins));

  // If wins reach threshold and no active champion yet, set 1-day boost
  if (wins >= AI_HIGHLIGHT_THRESHOLD) {
    const until = Date.now() + AI_HIGHLIGHT_DURATION_MS;
    localStorage.setItem('xoxAiChampionUntil', String(until));
  }

  console.log('AI wins:', wins, 'champion until:', localStorage.getItem('xoxAiChampionUntil'));
}        
        
        
     


async function loadUserAvatar() {
  try {
    const profileRef = doc(db, "profiles", userId);
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      const data = snap.data();
      currentAvatarUrl = data.avatarUrl || null;
    }
  } catch (err) {
    console.error("Error loading avatar:", err);
  }
}


function updateMenuAvatar() {
  const menuPic = document.getElementById("menuProfilePic");
  if (!menuPic) return;

  if (currentAvatarUrl) {
    menuPic.src = currentAvatarUrl;
  } else {
    menuPic.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; // placeholder
  }
}


await loadUserAvatar();

updateMenuAvatar();

async function saveUserAvatar(url) {
  try {
    const profileRef = doc(db, "profiles", userId);
    await setDoc(profileRef, { avatarUrl: url }, { merge: true });
    currentAvatarUrl = url;
  } catch (err) {
    console.error("Error saving avatar:", err);
    showToast && showToast("Error saving profile picture");
  }
}


async function getUserCoins() {
  if (!userId) return 0;
  const coinRef = firestoreDoc(db, 'coin', String(userId));
  const snap = await getDoc(coinRef);
  const coins = (snap.exists() && Number(snap.data().coin)) || 0;
  console.log("Current CE coin for avatar:", coins);
  return coins;
}

async function spendUserCoins(amount) {
  if (!userId) throw new Error("No userId");
  const coinRef = firestoreDoc(db, 'coin', String(userId));

  const snap = await getDoc(coinRef);
  const current = (snap.exists() && Number(snap.data().coin)) || 0;

  if (current < amount) {
    throw new Error("Not enough coins");
  }

  const newVal = Math.max(0, current - amount);

  await setDoc(
    coinRef,
    { coin: newVal, updatedAt: serverTimestamp() },
    { merge: true }
  );

  // update UI
  if (typeof ceCoinEl !== "undefined" && ceCoinEl) {
    ceCoinEl.textContent = String(newVal);
  }

  console.log(`CE coin spent: ${amount}, remaining: ${newVal}`);
}


if (changeAvatarBtn && avatarFileInput) {
  changeAvatarBtn.addEventListener("click", async () => {
    try {
      const coins = await getUserCoins();
      if (coins < 30) {
        showToast && showToast("You need 30 CE coins to change profile picture.");
        return;
      }

      // Ask user to confirm spending 30 coins
      if (!confirm("Change profile picture for 30 CE coins?")) return;

      // Open file picker
      avatarFileInput.click();
    } catch (err) {
      console.error("Error checking coins:", err);
      showToast && showToast("Error checking coin balance");
    }
  });

  avatarFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await res.json();
      if (!data.secure_url) {
        throw new Error("No secure_url from Cloudinary");
      }

      const url = data.secure_url;

      // Spend coins
      await spendUserCoins(30);

      // Save avatar URL in Firestore
      await saveUserAvatar(url);

      showToast && showToast("Profile picture updated successfully ✨");

      // Clear input so same file can be chosen again if needed
      avatarFileInput.value = "";
    } catch (err) {
      console.error("Avatar upload error:", err);
      showToast && showToast("Error uploading profile picture");
      avatarFileInput.value = "";
    }
  });
}

        
        
  
  
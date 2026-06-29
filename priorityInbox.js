/**
 * Campus Notifications Priority Inbox
 * Stage 1 Deliverable
 *
 * Usage:
 *   node priorityInbox.js
 *
 * To run with an API token:
 *   $env:API_TOKEN="your_token_here"; node priorityInbox.js
 */

const http = require('http');

// Configuration
const API_URL = 'http://4.224.186.213/evaluation-service/notifications';
const API_TOKEN = process.env.API_TOKEN || null;
const TOP_N = 10;

// Priority weights: Placement > Result > Event
const WEIGHTS = {
  'placement': 3,
  'result': 2,
  'event': 1
};

// Helper to determine notification type from content text
function detectType(content) {
  const text = content.toLowerCase();
  if (text.includes('hire') || text.includes('hiring') || text.includes('placement') || text.includes('recruit') || text.includes('job') || text.includes('career')) {
    return 'placement';
  }
  if (text.includes('result') || text.includes('grade') || text.includes('marks') || text.includes('exam') || text.includes('evaluation') || text.includes('cgpa')) {
    return 'result';
  }
  return 'event'; // Default category
}

// Priority comparison logic
function compareNotifications(a, b) {
  const weightA = WEIGHTS[a.type] || 0;
  const weightB = WEIGHTS[b.type] || 0;

  // 1. Compare by Weight (Placement > Result > Event)
  if (weightA !== weightB) {
    return weightB - weightA; // Descending
  }

  // 2. Compare by Recency (Newest first)
  const timeA = new Date(a.timestamp).getTime();
  const timeB = new Date(b.timestamp).getTime();
  return timeB - timeA; // Descending
}

// Generate realistic mock data if API is unavailable or unauthorized
function generateMockNotifications() {
  console.log('\n[INFO] Using mock notifications fallback data.');
  const now = new Date();
  
  // Return a realistic list of unread and read notifications
  return [
    {
      id: 'ea836726-c25e-4f21-a72f-544a6af8a37f',
      content: 'project-review',
      timestamp: '2026-04-22T17:50:42.000Z',
      type: 'result',
      isRead: false
    },
    {
      id: '003cb427-8fc6-47f7-bb8e-be228f6b8d2c',
      content: 'external',
      timestamp: '2026-04-22T17:58:30.000Z',
      type: 'result',
      isRead: false
    },
    {
      id: 'e5c4ff28-31bf-4d40-8492-72fda59e8918',
      content: 'project-review',
      timestamp: '2026-04-22T17:50:18.000Z',
      type: 'result',
      isRead: false
    },
    {
      id: 'icfce5ee-ad37-4894-8946-070762717625',
      content: 'tech-fest',
      timestamp: '2026-04-22T17:50:06.000Z',
      type: 'event',
      isRead: false
    },
    {
      id: 'cf2885a6-45ac-4ba8-b548-6e9e9d4c52c8',
      content: 'project-review',
      timestamp: '2026-04-22T17:49:54.000Z',
      type: 'result',
      isRead: false
    },
    {
      id: '8a7412bd-6865-4d89-8501-a37f11cc848b',
      content: 'Advanced Micro Devices Inc. hiring',
      timestamp: '2026-04-22T17:49:42.000Z',
      type: 'placement',
      isRead: false
    }
  ];
}

// Fetch notifications from the external API
function fetchNotifications() {
  return new Promise((resolve, reject) => {
    if (!API_TOKEN) {
      resolve(generateMockNotifications());
      return;
    }

    console.log(`[INFO] Fetching notifications from API...`);
    const options = {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json'
      },
      timeout: 5000
    };

    http.get(API_URL, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            const rawNotifications = parsed.notifications || parsed || [];
            
            // Map raw API formats to standard objects
            const notifications = rawNotifications.map((item, index) => {
              if (typeof item === 'string') {
                // Parse CSV-like string if raw string returned (e.g. from prompt description)
                const parts = item.split(',');
                const content = parts[0]?.trim() || item;
                const rest = parts[1]?.trim() || '';
                const idMatch = rest.match(/#[A-Za-z0-9-]+/);
                const id = idMatch ? idMatch[0] : `gen-${index}`;
                const timestamp = rest.replace(id || '', '').trim() || new Date().toISOString();
                
                return {
                  id,
                  content,
                  timestamp,
                  isRead: false
                };
              }
              
              return {
                id: item.id || item.ID || item._id || `gen-${index}`,
                content: item.content || item.message || item.Message || '',
                timestamp: item.timestamp || item.Timestamp || item.createdAt || new Date().toISOString(),
                isRead: !!item.isRead,
                type: (item.type || item.Type || '').toLowerCase() || null
              };
            });

            resolve(notifications);
          } catch (e) {
            console.error('[ERROR] Failed to parse API JSON response:', e.message);
            resolve(generateMockNotifications());
          }
        } else {
          console.warn(`[WARN] API returned status ${res.statusCode}.`);
          resolve(generateMockNotifications());
        }
      });
    }).on('error', (err) => {
      console.error('[ERROR] Network error connecting to API:', err.message);
      resolve(generateMockNotifications());
    });
  });
}

// Main logic
async function run() {
  try {
    const rawList = await fetchNotifications();
    
    // Process and enrich notifications
    const processedList = rawList.map(n => ({
      ...n,
      type: n.type || detectType(n.content)
    }));

    // Filter unread notifications
    const unreadList = processedList.filter(n => !n.isRead);

    // Sort by priority (weight + recency)
    const prioritizedList = [...unreadList].sort(compareNotifications);

    // Slice top N (e.g., top 10)
    const topNotifications = prioritizedList.slice(0, TOP_N);

    // Print output
    console.log('\n' + '='.repeat(80));
    console.log(`                PRIORITY INBOX: TOP ${TOP_N} UNREAD NOTIFICATIONS`);
    console.log('='.repeat(80));
    console.log(`Total Unread: ${unreadList.length} | Displaying: ${topNotifications.length}`);
    console.log('-'.repeat(80));

    if (topNotifications.length === 0) {
      console.log('No unread notifications.');
    } else {
      topNotifications.forEach((n, idx) => {
        const typeEmoji = n.type === 'placement' ? '💼 [Placement]' : n.type === 'result' ? '🎓 [Result]' : '📅 [Event]';
        console.log(`${(idx + 1).toString().padStart(2, ' ')}. ${typeEmoji.padEnd(13)} | ${n.content}`);
        console.log(`    ID: ${n.id.padEnd(28)} | Sent: ${new Date(n.timestamp).toLocaleString()}`);
        console.log('-'.repeat(80));
      });
    }
  } catch (error) {
    console.error('Fatal error during Priority Inbox execution:', error);
  }
}

run();

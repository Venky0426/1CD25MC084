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
      id: '154ata-Bad-477-0554-52558',
      content: 'CSK Corporation hiring Software Engineer Interns. Apply by end of week!',
      timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // 30 mins ago
      isRead: false
    },
    {
      id: '201bta-Gud-112-9843-12849',
      content: 'Semester 3 Re-evaluation Results are out. Check your student portal.',
      timestamp: new Date(now.getTime() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      isRead: false
    },
    {
      id: '302cta-Evt-441-2391-49204',
      content: 'Annual Cultural Fest "Bloom 2026" registrations open now!',
      timestamp: new Date(now.getTime() - 1000 * 60 * 10).toISOString(), // 10 mins ago (Recent but lower weight)
      isRead: false
    },
    {
      id: '405dta-Plc-882-1249-58291',
      content: 'Microsoft Campus Recruitment Drive starts next Monday. Registration mandatory.',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      isRead: false
    },
    {
      id: '509eta-Res-901-3829-10928',
      content: 'Mid-term DSA Exam Marks published for MCA Batch.',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
      isRead: false
    },
    {
      id: '601fta-Evt-221-9029-38291',
      content: 'Guest Lecture on "Prompt Engineering & GenAI" in Seminar Hall 1.',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
      isRead: false
    },
    {
      id: '702gta-Plc-331-4829-91829',
      content: 'Google India Off-Campus hiring for Cloud Support Roles.',
      timestamp: new Date(now.getTime() - 1000 * 60 * 15).toISOString(), // 15 mins ago (Recent & high weight)
      isRead: false
    },
    {
      id: '809hta-Res-102-3921-29182',
      content: 'Operating Systems Practical Exam Grades updated.',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      isRead: false
    },
    {
      id: '901ita-Evt-103-4928-10928',
      content: 'Codeathon 2026 organized by Computer Science Club.',
      timestamp: new Date(now.getTime() - 1000 * 60 * 45).toISOString(), // 45 mins ago
      isRead: false
    },
    {
      id: '102jta-Plc-104-5829-29182',
      content: 'Accenture onboarding updates sent to all selected candidates.',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
      isRead: false
    },
    {
      id: '112kta-Res-105-9281-29182',
      content: 'DBMS Project Evaluation schedule announced.',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
      isRead: false
    },
    {
      id: '122lta-Evt-106-9281-39281',
      content: 'Inter-College Sports Meet team selections tomorrow.',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
      isRead: true // Read notification (should be filtered out of Priority Inbox)
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
                id: item.id || item._id || `gen-${index}`,
                content: item.content || item.message || '',
                timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
                isRead: !!item.isRead
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
      type: detectType(n.content)
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

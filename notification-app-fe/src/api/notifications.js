import { logger } from "./logger";

const BASE_URL = 'http://4.224.186.213/evaluation-service/notifications';

// Priority weights: Placement > Result > Event
const WEIGHTS = {
  'placement': 3,
  'result': 2,
  'event': 1
};

function detectType(content) {
  const text = (content || '').toLowerCase();
  if (text.includes('hire') || text.includes('hiring') || text.includes('placement') || text.includes('recruit') || text.includes('job') || text.includes('career')) {
    return 'placement';
  }
  if (text.includes('result') || text.includes('grade') || text.includes('marks') || text.includes('exam') || text.includes('evaluation') || text.includes('cgpa')) {
    return 'result';
  }
  return 'event';
}

// Generate premium mock notifications (persisted in session/local storage for read/write state consistency)
const MOCK_STORAGE_KEY = 'campus_mock_notifications_v2';

function getOrSeedMockData() {
  let stored = null;
  try {
    stored = localStorage.getItem(MOCK_STORAGE_KEY);
  } catch (e) {}

  if (stored) {
    return JSON.parse(stored);
  }

  // Seed data using user-provided JSON test cases
  const seed = [
    { id: 'ea836726-c25e-4f21-a72f-544a6af8a37f', content: 'project-review', timestamp: '2026-04-22T17:50:42.000Z', type: 'Result' },
    { id: '003cb427-8fc6-47f7-bb8e-be228f6b8d2c', content: 'external', timestamp: '2026-04-22T17:58:30.000Z', type: 'Result' },
    { id: 'e5c4ff28-31bf-4d40-8492-72fda59e8918', content: 'project-review', timestamp: '2026-04-22T17:50:18.000Z', type: 'Result' },
    { id: 'icfce5ee-ad37-4894-8946-070762717625', content: 'tech-fest', timestamp: '2026-04-22T17:50:06.000Z', type: 'Event' },
    { id: 'cf2885a6-45ac-4ba8-b548-6e9e9d4c52c8', content: 'project-review', timestamp: '2026-04-22T17:49:54.000Z', type: 'Result' },
    { id: '8a7412bd-6865-4d89-8501-a37f11cc848b', content: 'Advanced Micro Devices Inc. hiring', timestamp: '2026-04-22T17:49:42.000Z', type: 'Placement' }
  ];

  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(seed));
  } catch (e) {}

  return seed;
}

export async function fetchNotifications({ page = 1, limit = 10, notificationType = 'All' } = {}) {
  const startTime = performance.now();
  const token = import.meta.env.VITE_API_TOKEN || localStorage.getItem('api_token') || null;

  logger.info('API', `Fetching notifications: page=${page}, limit=${limit}, type=${notificationType}`, { page, limit, notificationType });

  if (!token) {
    logger.warn('API', 'No VITE_API_TOKEN found, falling back to mock data.');
    return handleMockRequest(page, limit, notificationType, startTime);
  }

  // Construct query parameters
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (notificationType && notificationType !== 'All') {
    // Pass both parameters to satisfy different potential backend expectations
    params.append('notification type', notificationType);
    params.append('notification_type', notificationType);
    params.append('type', notificationType.toLowerCase());
  }

  const url = `${BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const duration = Math.round(performance.now() - startTime);

    if (response.ok) {
      const data = await response.json();
      logger.success('API', `Successfully fetched notifications from server in ${duration}ms`, { url, duration, status: response.status });
      
      const rawList = data.notifications || data || [];
      const notifications = rawList.map((item, idx) => {
        if (typeof item === 'string') {
          const parts = item.split(',');
          const content = parts[0]?.trim() || item;
          const rest = parts[1]?.trim() || '';
          const idMatch = rest.match(/#[A-Za-z0-9-]+/);
          const id = idMatch ? idMatch[0] : `gen-${idx}`;
          const timestamp = rest.replace(id || '', '').trim() || new Date().toISOString();
          return { id, content, timestamp, type: detectType(content) };
        }
        return {
          id: item.id || item._id || `gen-${idx}`,
          content: item.content || item.message || '',
          timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
          type: item.type || detectType(item.content || item.message)
        };
      });

      return {
        notifications,
        total: data.total || notifications.length,
        totalPages: data.totalPages || Math.ceil((data.total || notifications.length) / limit)
      };
    } else {
      const errorText = await response.text();
      logger.error('API', `API request failed with status ${response.status} in ${duration}ms`, { url, duration, status: response.status, errorText });
      return handleMockRequest(page, limit, notificationType, startTime);
    }
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.error('API', `Network error during fetch after ${duration}ms: ${error.message}`, { url, duration });
    return handleMockRequest(page, limit, notificationType, startTime);
  }
}

// Mock request handler matching the API's pagination and filtering logic
function handleMockRequest(page, limit, notificationType, startTime) {
  const allData = getOrSeedMockData();
  
  // Apply filtering
  let filtered = allData;
  if (notificationType && notificationType !== 'All') {
    filtered = allData.filter(n => n.type.toLowerCase() === notificationType.toLowerCase());
  }

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);
  const totalPages = Math.ceil(filtered.length / limit);

  const duration = Math.round(performance.now() - startTime);
  logger.success('API', `Served mock data in ${duration}ms (fallback logic)`, { duration, count: paginated.length, total: filtered.length });

  return {
    notifications: paginated,
    total: filtered.length,
    totalPages: totalPages
  };
}

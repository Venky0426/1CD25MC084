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
const MOCK_STORAGE_KEY = 'campus_mock_notifications';

function getOrSeedMockData() {
  let stored = null;
  try {
    stored = localStorage.getItem(MOCK_STORAGE_KEY);
  } catch (e) {}

  if (stored) {
    return JSON.parse(stored);
  }

  // Seed data
  const now = new Date();
  const seed = [
    { id: 'n-1', content: 'CSK Corporation hiring Software Engineer Interns. Apply by end of week!', timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString() },
    { id: 'n-2', content: 'Semester 3 Re-evaluation Results are out. Check your student portal.', timestamp: new Date(now.getTime() - 1000 * 60 * 120).toISOString() },
    { id: 'n-3', content: 'Annual Cultural Fest "Bloom 2026" registrations open now!', timestamp: new Date(now.getTime() - 1000 * 60 * 10).toISOString() },
    { id: 'n-4', content: 'Microsoft Campus Recruitment Drive starts next Monday. Registration mandatory.', timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString() },
    { id: 'n-5', content: 'Mid-term DSA Exam Marks published for MCA Batch.', timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString() },
    { id: 'n-6', content: 'Guest Lecture on "Prompt Engineering & GenAI" in Seminar Hall 1.', timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString() },
    { id: 'n-7', content: 'Google India Off-Campus hiring for Cloud Support Roles.', timestamp: new Date(now.getTime() - 1000 * 60 * 15).toISOString() },
    { id: 'n-8', content: 'Operating Systems Practical Exam Grades updated.', timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString() },
    { id: 'n-9', content: 'Codeathon 2026 organized by Computer Science Club.', timestamp: new Date(now.getTime() - 1000 * 60 * 45).toISOString() },
    { id: 'n-10', content: 'Accenture onboarding updates sent to all selected candidates.', timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString() },
    { id: 'n-11', content: 'DBMS Project Evaluation schedule announced.', timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 8).toISOString() },
    { id: 'n-12', content: 'Inter-College Sports Meet team selections tomorrow.', timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 36).toISOString() },
    { id: 'n-13', content: 'Amazon WoW (Women in Technology) Internship Program registrations open.', timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString() },
    { id: 'n-14', content: 'Cisco Systems hiring Network Engineer Interns.', timestamp: new Date(now.getTime() - 1000 * 60 * 180).toISOString() },
    { id: 'n-15', content: 'Mobile App Development Workshop by Pralotech Solutions.', timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString() }
  ].map(n => ({
    ...n,
    type: detectType(n.content)
  }));

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

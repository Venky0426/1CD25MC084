import { useState, useEffect } from "react";
import { ThemeProvider, createTheme, CssBaseline, Box, Container, Fab, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Navbar } from "./components/Navbar";
import { NotificationsPage } from "./pages/NotificationsPage";
import { PriorityInboxPage } from "./pages/PriorityInboxPage";
import { fetchNotifications } from "./api/notifications";
import { logger } from "./api/logger";

// Define a premium Material UI Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1e3c72',
      dark: '#112244',
      light: '#2a5298',
    },
    secondary: {
      main: '#5e35b1',
      dark: '#4527a0',
      light: '#7e57c2',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
    }
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', 'Inter', 'Roboto', sans-serif",
    button: {
      fontWeight: 600,
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        }
      }
    }
  }
});

const READ_STORAGE_KEY = 'campus_read_notification_ids';

export default function App() {
  const [activePage, setActivePage] = useState('feed');
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load read notification IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(READ_STORAGE_KEY);
      if (stored) {
        setReadNotificationIds(JSON.parse(stored));
      }
    } catch (e) {
      logger.error('App', 'Failed to load read notification IDs', { error: e.message });
    }
  }, []);

  // Fetch all notifications to compute global unread count badge
  useEffect(() => {
    const updateUnreadCount = async () => {
      try {
        const data = await fetchNotifications({ page: 1, limit: 100, notificationType: 'All' });
        const list = data.notifications || [];
        const unread = list.filter(n => !readNotificationIds.includes(n.id)).length;
        setUnreadCount(unread);
      } catch (err) {
        logger.error('App', 'Failed to calculate unread badge count', { error: err.message });
      }
    };

    updateUnreadCount();
  }, [readNotificationIds]);

  // Handler to mark a notification as read
  const handleMarkAsRead = (id) => {
    if (!readNotificationIds.includes(id)) {
      const updated = [...readNotificationIds, id];
      setReadNotificationIds(updated);
      try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
        logger.success('UI', `Notification marked as read: ${id}`, { id });
      } catch (e) {
        logger.error('UI', 'Failed to write read state to localStorage', { error: e.message });
      }
    }
  };

  // Handler to clear read notifications (reset state)
  const handleResetReadState = () => {
    setReadNotificationIds([]);
    try {
      localStorage.removeItem(READ_STORAGE_KEY);
      logger.info('UI', 'Reset all notification read states');
    } catch (e) { }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display="flex" flexDirection="column" minHeight="100vh" bgcolor="#f4f6f8">
        <Navbar
          activePage={activePage}
          setActivePage={setActivePage}
          unreadCount={unreadCount}
        />

        <Container maxWidth="md" sx={{ flexGrow: 1, py: 2 }}>
          {activePage === 'feed' ? (
            <NotificationsPage
              readNotificationIds={readNotificationIds}
              onMarkAsRead={handleMarkAsRead}
            />
          ) : (
            <PriorityInboxPage
              readNotificationIds={readNotificationIds}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
        </Container>

        {readNotificationIds.length > 0 && (
          <Tooltip title="Mark all as unread" placement="left">
            <Fab
              color="error"
              aria-label="clear"
              onClick={handleResetReadState}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
              }}
            >
              <DeleteIcon />
            </Fab>
          </Tooltip>
        )}
      </Box>
    </ThemeProvider>
  );
}
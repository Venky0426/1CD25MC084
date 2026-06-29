import { useState } from "react";
import {
  Alert,
  Badge,
  Box,
  CircularProgress,
  Divider,
  Pagination,
  Stack,
  Typography,
  Paper,
} from "@mui/material";
import { Notifications as NotificationsIcon } from "@mui/icons-material";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";

export function NotificationsPage({ readNotificationIds, onMarkAsRead }) {
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const limit = 6; // Set to a sleek, compact size per page

  const { notifications, totalPages, loading, error } = useNotifications({
    page,
    limit,
    filter
  });

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1); // Reset page on filter change
  };

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
  };

  // Count unread count locally for this page's visibility or just show total unread
  const unreadCount = notifications.filter(n => !readNotificationIds.includes(n.id)).length;

  return (
    <Paper 
      elevation={0}
      sx={{ 
        maxWidth: 720, 
        mx: "auto", 
        px: { xs: 2, sm: 4 }, 
        py: 4, 
        mt: 4, 
        mb: 6,
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
        backgroundColor: '#fafbfc'
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <Box 
            sx={{ 
              p: 1, 
              borderRadius: '12px', 
              backgroundColor: 'rgba(30, 60, 114, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <NotificationsIcon sx={{ fontSize: 28, color: '#1e3c72' }} />
          </Box>
        </Badge>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#1e3c72">
            General Feed
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Real-time campus placement drives, academic results, and events
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ marginBottom: 3 }}>
        <NotificationFilter value={filter} onChange={handleFilterChange} />
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="primary" thickness={4} />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: '8px' }}>
          Failed to load notifications: {error}
        </Alert>
      )}

      {!loading && !error && notifications.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: '8px' }}>
          No notifications found matching your selection.
        </Alert>
      )}

      {!loading && !error && notifications.length > 0 && (
        <Stack spacing={2}>
          {notifications.map((n) => {
            const isRead = readNotificationIds.includes(n.id);
            return (
              <NotificationCard
                key={n.id}
                notification={n}
                isRead={isRead}
                onView={onMarkAsRead}
              />
            );
          })}
        </Stack>
      )}

      {!loading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="medium"
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 600,
                borderRadius: '8px'
              }
            }}
          />
        </Box>
      )}
    </Paper>
  );
}

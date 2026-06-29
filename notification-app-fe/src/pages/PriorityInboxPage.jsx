import { useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Stack,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Inbox as InboxIcon } from "@mui/icons-material";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";

// Priority weights: Placement > Result > Event
const WEIGHTS = {
  'placement': 3,
  'result': 2,
  'event': 1
};

export function PriorityInboxPage({ readNotificationIds, onMarkAsRead }) {
  const [filter, setFilter] = useState("All");
  const [limit, setLimit] = useState(10); // User choice for n: 10, 15, 20

  // Fetch a larger pool of notifications to ensure we can extract and sort the top unread ones
  const { notifications, loading, error } = useNotifications({
    page: 1,
    limit: 50, // Fetch top 50 to extract unread items
    filter: 'All' // Get all to sort them under correct priorities
  });

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleLimitChange = (event) => {
    setLimit(Number(event.target.value));
  };

  // 1. Filter out already viewed (read) notifications
  const unreadNotifications = notifications.filter(n => !readNotificationIds.includes(n.id));

  // 2. Sort by Priority (Weight desc, Recency desc)
  const sortedNotifications = [...unreadNotifications].sort((a, b) => {
    const wA = WEIGHTS[a.type] || 0;
    const wB = WEIGHTS[b.type] || 0;
    if (wA !== wB) {
      return wB - wA; // Weight descending
    }
    return new Date(b.timestamp) - new Date(a.timestamp); // Recency descending
  });

  // 3. Filter by Notification Type if requested
  const filteredNotifications = filter === 'All' 
    ? sortedNotifications 
    : sortedNotifications.filter(n => n.type.toLowerCase() === filter.toLowerCase());

  // 4. Slice to the top N limit
  const displayNotifications = filteredNotifications.slice(0, limit);

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
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2} mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box 
            sx={{ 
              p: 1, 
              borderRadius: '12px', 
              backgroundColor: 'rgba(94, 53, 177, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <InboxIcon sx={{ fontSize: 28, color: '#5e35b1' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#5e35b1">
              Priority Inbox
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Top unread notifications ranked by weight and recency
            </Typography>
          </Box>
        </Stack>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="limit-select-label">Show Top N</InputLabel>
          <Select
            labelId="limit-select-label"
            id="limit-select"
            value={limit}
            label="Show Top N"
            onChange={handleLimitChange}
            sx={{ borderRadius: '8px', fontWeight: 600 }}
          >
            <MenuItem value={10}>Top 10</MenuItem>
            <MenuItem value={15}>Top 15</MenuItem>
            <MenuItem value={20}>Top 20</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ marginBottom: 3 }}>
        <NotificationFilter value={filter} onChange={handleFilterChange} />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="secondary" thickness={4} />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: '8px' }}>
          Failed to load priority inbox: {error}
        </Alert>
      )}

      {!loading && !error && displayNotifications.length === 0 && (
        <Alert severity="success" sx={{ borderRadius: '8px' }}>
          Inbox Zero! You have no unread priority notifications matching this filter.
        </Alert>
      )}

      {!loading && !error && displayNotifications.length > 0 && (
        <Stack spacing={2}>
          {displayNotifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              isRead={false} // All items in priority inbox are unread
              onView={onMarkAsRead}
            />
          ))}
        </Stack>
      )}

      {!loading && sortedNotifications.length > limit && (
        <Typography variant="caption" display="block" textAlign="center" color="text.secondary" mt={3} fontWeight={500}>
          Showing top {limit} of {filteredNotifications.length} matching unread notifications.
        </Typography>
      )}
    </Paper>
  );
}

import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { 
  Work as WorkIcon, 
  School as SchoolIcon, 
  Event as EventIcon, 
  FiberManualRecord as FiberManualRecordIcon 
} from "@mui/icons-material";

export function NotificationCard({ notification, isRead, onView }) {
  const { id, content, timestamp, type } = notification;

  // Premium color mappings for categories
  const getCategoryConfig = (type) => {
    switch (type?.toLowerCase()) {
      case 'placement':
        return {
          label: 'Placement',
          color: '#f4511e', // Hot Coral
          bgColor: 'rgba(244, 81, 30, 0.08)',
          icon: <WorkIcon sx={{ fontSize: 16, color: '#f4511e' }} />
        };
      case 'result':
        return {
          label: 'Result',
          color: '#00897b', // Teal
          bgColor: 'rgba(0, 137, 123, 0.08)',
          icon: <SchoolIcon sx={{ fontSize: 16, color: '#00897b' }} />
        };
      case 'event':
      default:
        return {
          label: 'Event',
          color: '#5e35b1', // Violet
          bgColor: 'rgba(94, 53, 177, 0.08)',
          icon: <EventIcon sx={{ fontSize: 16, color: '#5e35b1' }} />
        };
    }
  };

  const config = getCategoryConfig(type);

  // Format date nicely
  const formatDate = (isoStr) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <Card
      onClick={() => onView(id)}
      sx={{
        cursor: 'pointer',
        position: 'relative',
        borderRadius: '12px',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        border: '1px solid',
        borderColor: isRead ? 'rgba(0,0,0,0.06)' : 'rgba(30, 60, 114, 0.15)',
        backgroundColor: isRead ? '#fff' : 'rgba(30, 60, 114, 0.02)',
        boxShadow: isRead 
          ? '0 2px 4px rgba(0,0,0,0.03)' 
          : '0 4px 12px rgba(30, 60, 114, 0.06)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
          borderColor: isRead ? 'rgba(0,0,0,0.12)' : 'rgba(30, 60, 114, 0.3)'
        }
      }}
    >
      <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            {!isRead && (
              <FiberManualRecordIcon sx={{ fontSize: 12, color: '#007aff' }} />
            )}
            <Chip
              icon={config.icon}
              label={config.label}
              size="small"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: config.color,
                backgroundColor: config.bgColor,
                border: '1px solid',
                borderColor: 'rgba(0,0,0,0.03)'
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {formatDate(timestamp)}
          </Typography>
        </Box>

        <Typography
          variant="body1"
          fontWeight={isRead ? 500 : 700}
          color={isRead ? 'text.secondary' : 'text.primary'}
          sx={{
            lineHeight: 1.5,
            wordBreak: 'break-word',
            mt: 0.5
          }}
        >
          {content}
        </Typography>

        <Box display="flex" justifyContent="flex-end" mt={1}>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
            ID: {id}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

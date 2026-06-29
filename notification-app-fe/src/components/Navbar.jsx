import { AppBar, Toolbar, Typography, Button, Badge, Box, IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from "@mui/material";
import { 
  Notifications as NotificationsIcon, 
  Settings as SettingsIcon, 
  Inbox as InboxIcon 
} from "@mui/icons-material";
import { useState } from "react";
import { logger } from "../api/logger";

export function Navbar({ activePage, setActivePage, unreadCount }) {
  const [openSettings, setOpenSettings] = useState(false);
  const [tokenInput, setTokenInput] = useState(localStorage.getItem('api_token') || '');

  const handleSaveToken = () => {
    if (tokenInput.trim()) {
      localStorage.setItem('api_token', tokenInput.trim());
      logger.success('Auth', 'Saved API token to localStorage');
    } else {
      localStorage.removeItem('api_token');
      logger.info('Auth', 'Cleared API token from localStorage');
    }
    setOpenSettings(false);
    // Reload page to apply changes
    window.location.reload();
  };

  return (
    <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <NotificationsIcon sx={{ fontSize: 28, color: '#00f2fe' }} />
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '0.5px' }}>
            Campus<span style={{ color: '#00f2fe' }}>Connect</span>
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1.5}>
          <Button
            variant={activePage === 'feed' ? 'contained' : 'text'}
            onClick={() => setActivePage('feed')}
            startIcon={
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            }
            sx={{
              textTransform: 'none',
              borderRadius: '20px',
              backgroundColor: activePage === 'feed' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: '#fff',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.25)',
              }
            }}
          >
            All Feed
          </Button>

          <Button
            variant={activePage === 'priority' ? 'contained' : 'text'}
            onClick={() => setActivePage('priority')}
            startIcon={<InboxIcon />}
            sx={{
              textTransform: 'none',
              borderRadius: '20px',
              backgroundColor: activePage === 'priority' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: '#fff',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.25)',
              }
            }}
          >
            Priority Inbox
          </Button>

          <IconButton onClick={() => setOpenSettings(true)} sx={{ color: '#fff' }}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>

      <Dialog open={openSettings} onClose={() => setOpenSettings(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>API Authentication Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Enter your evaluation service authorization token. If left blank, the application will fallback to generating mock campus notifications.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="API Token (Bearer)"
            type="text"
            fullWidth
            variant="outlined"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettings(false)}>Cancel</Button>
          <Button onClick={handleSaveToken} variant="contained" color="primary">Save & Apply</Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}

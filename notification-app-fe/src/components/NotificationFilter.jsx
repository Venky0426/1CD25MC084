import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const filters = ["All", "Placement", "Result", "Event"];

export function NotificationFilter({ value, onChange }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      size="small"
      onChange={(e, nextValue) => {
        if (nextValue !== null) {
          onChange(nextValue);
        }
      }}
      sx={{ 
        flexWrap: "wrap", 
        gap: 0.5,
        '& .MuiToggleButton-root': {
          border: '1px solid rgba(0,0,0,0.12) !important',
          borderRadius: '8px !important',
          textTransform: 'none',
          px: 2.5,
          fontWeight: 600,
          '&.Mui-selected': {
            backgroundColor: '#1e3c72',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#2a5298',
            }
          }
        }
      }}
    >
      {filters.map((type) => (
        <ToggleButton key={type} value={type}>
          {type}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
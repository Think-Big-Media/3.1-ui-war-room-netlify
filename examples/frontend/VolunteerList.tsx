/**
 * Example React component for displaying a list of volunteers.
 * Shows patterns for:
 * - TypeScript interfaces
 * - React hooks (useState, useEffect, custom hooks)
 * - API integration
 * - Material-UI components
 * - Loading states and error handling
 * - Filtering and pagination
 */

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Pagination,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../contexts/AuthContext';
import { volunteerApi } from '../../services/api/volunteerApi';
import { type Volunteer, type VolunteerStatus } from '../../types/volunteer';

interface VolunteerListProps {
  onSelectVolunteer?: (volunteer: Volunteer) => void;
  filterByEvent?: number;
}

export const VolunteerList: React.FC<VolunteerListProps> = ({
  onSelectVolunteer,
  filterByEvent,
}) => {
  // State management
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VolunteerStatus | 'all'>('all');
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);

  // Hooks
  const { user, hasPermission } = useAuth();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch volunteers
  const fetchVolunteers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        search: debouncedSearchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        skills: skillsFilter.length > 0 ? skillsFilter : undefined,
        eventId: filterByEvent,
      };

      const response = await volunteerApi.getVolunteers(params);

      setVolunteers(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError('Failed to load volunteers. Please try again.');
      console.error('Error fetching volunteers:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchTerm, statusFilter, skillsFilter, filterByEvent]);

  // Effect to fetch data
  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  // Handlers
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleStatusChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStatusFilter(event.target.value as VolunteerStatus | 'all');
    setPage(1); // Reset to first page
  };

  const handleVolunteerClick = (volunteer: Volunteer) => {
    if (onSelectVolunteer) {
      onSelectVolunteer(volunteer);
    }
  };

  // Status color mapping
  const getStatusColor = (status: VolunteerStatus): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Render loading state
  if (loading && volunteers.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Filters */}
      <Box mb={3} p={2} component={Card}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search volunteers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusChange}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={5}>
            <Typography variant="body2" color="textSecondary">
              Showing {volunteers.length} volunteers
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Volunteer Cards */}
      <Grid container spacing={2}>
        {volunteers.map((volunteer) => (
          <Grid item xs={12} md={6} lg={4} key={volunteer.id}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => handleVolunteerClick(volunteer)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    src={volunteer.avatarUrl}
                    alt={`${volunteer.firstName} ${volunteer.lastName}`}
                    sx={{ width: 56, height: 56, mr: 2 }}
                  >
                    {volunteer.firstName[0]}{volunteer.lastName[0]}
                  </Avatar>

                  <Box flexGrow={1}>
                    <Typography variant="h6">
                      {volunteer.firstName} {volunteer.lastName}
                    </Typography>
                    <Chip
                      label={volunteer.status}
                      size="small"
                      color={getStatusColor(volunteer.status)}
                    />
                  </Box>

                  {hasPermission('volunteers.edit') && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle edit
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>

                <Box mb={1}>
                  <Box display="flex" alignItems="center" mb={0.5}>
                    <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="textSecondary">
                      {volunteer.email}
                    </Typography>
                  </Box>

                  {volunteer.phone && (
                    <Box display="flex" alignItems="center">
                      <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="textSecondary">
                        {volunteer.phone}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {volunteer.skills && volunteer.skills.length > 0 && (
                  <Box>
                    {volunteer.skills.slice(0, 3).map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                    {volunteer.skills.length > 3 && (
                      <Typography variant="caption" color="textSecondary">
                        +{volunteer.skills.length - 3} more
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Empty state */}
      {volunteers.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No volunteers found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your filters or search terms
          </Typography>
        </Box>
      )}
    </Box>
  );
};

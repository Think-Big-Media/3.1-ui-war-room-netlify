/**
 * Example React form component for creating/editing events.
 * Shows patterns for:
 * - Complex form handling with React Hook Form
 * - Form validation with Yup
 * - Date/time pickers
 * - File uploads
 * - Multi-step forms
 * - Error handling
 */

import type React from 'react';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  Typography,
  Paper,
  MenuItem,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { eventApi } from '../../services/api/eventApi';
import { venueApi } from '../../services/api/venueApi';
import { FileUpload } from '../common/FileUpload';
import { LocationPicker } from '../common/LocationPicker';
import { type Event, EventType, type EventFormData } from '../../types/event';
import { useNotification } from '../../contexts/NotificationContext';

// Validation schema
const eventSchema = yup.object({
  title: yup.string().required('Title is required').max(200),
  description: yup.string().required('Description is required').max(2000),
  eventType: yup.string().oneOf(['rally', 'fundraiser', 'volunteer_drive', 'meeting']).required(),
  startDate: yup.date().required('Start date is required').min(new Date(), 'Start date must be in the future'),
  endDate: yup.date()
    .required('End date is required')
    .min(yup.ref('startDate'), 'End date must be after start date'),
  venue: yup.object({
    name: yup.string().required('Venue name is required'),
    address: yup.string().required('Address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    zipCode: yup.string().matches(/^\d{5}$/, 'Invalid zip code').required(),
    coordinates: yup.object({
      lat: yup.number().required(),
      lng: yup.number().required(),
    }).required('Please select location on map'),
  }),
  maxVolunteers: yup.number().min(1).nullable(),
  requiresRegistration: yup.boolean(),
  tags: yup.array().of(yup.string()),
  coverImage: yup.mixed().nullable(),
});

interface EventFormProps {
  event?: Event;
  onSuccess?: (event: Event) => void;
}

const steps = ['Basic Information', 'Location & Venue', 'Additional Details'];

export const EventForm: React.FC<EventFormProps> = ({ event, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: yupResolver(eventSchema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      eventType: event?.eventType || 'meeting',
      startDate: event?.startDate || null,
      endDate: event?.endDate || null,
      venue: event?.venue || {
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        coordinates: null,
      },
      maxVolunteers: event?.maxVolunteers || null,
      requiresRegistration: event?.requiresRegistration || true,
      tags: event?.tags || [],
      coverImage: null,
    },
  });

  // Load venues for dropdown
  useEffect(() => {
    const loadVenues = async () => {
      try {
        const response = await venueApi.getVenues();
        setVenues(response.data);
      } catch (error) {
        console.error('Failed to load venues:', error);
      }
    };
    loadVenues();
  }, []);

  // Form submission
  const onSubmit = async (data: EventFormData) => {
    try {
      setLoading(true);

      // Upload cover image if provided
      let coverImageUrl = event?.coverImageUrl;
      if (data.coverImage) {
        const uploadResponse = await eventApi.uploadCoverImage(data.coverImage);
        coverImageUrl = uploadResponse.url;
      }

      const eventData = {
        ...data,
        coverImageUrl,
      };

      let savedEvent;
      if (event) {
        savedEvent = await eventApi.updateEvent(event.id, eventData);
        showNotification('Event updated successfully', 'success');
      } else {
        savedEvent = await eventApi.createEvent(eventData);
        showNotification('Event created successfully', 'success');
      }

      if (onSuccess) {
        onSuccess(savedEvent);
      } else {
        navigate(`/events/${savedEvent.id}`);
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Failed to save event',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  // Step navigation
  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Event Title"
                    variant="outlined"
                    error={Boolean(errors.title)}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="eventType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.eventType)}>
                    <InputLabel>Event Type</InputLabel>
                    <Select {...field} label="Event Type">
                      <MenuItem value="rally">Rally</MenuItem>
                      <MenuItem value="fundraiser">Fundraiser</MenuItem>
                      <MenuItem value="volunteer_drive">Volunteer Drive</MenuItem>
                      <MenuItem value="meeting">Meeting</MenuItem>
                    </Select>
                    {errors.eventType && (
                      <FormHelperText>{errors.eventType.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="maxVolunteers"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Max Volunteers (optional)"
                    variant="outlined"
                    error={Boolean(errors.maxVolunteers)}
                    helperText={errors.maxVolunteers?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    variant="outlined"
                    error={Boolean(errors.description)}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label="Start Date & Time"
                      value={field.value}
                      onChange={field.onChange}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={Boolean(errors.startDate)}
                          helperText={errors.startDate?.message}
                        />
                      )}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label="End Date & Time"
                      value={field.value}
                      onChange={field.onChange}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={Boolean(errors.endDate)}
                          helperText={errors.endDate?.message}
                        />
                      )}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Venue Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="venue.name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Venue Name"
                    variant="outlined"
                    error={Boolean(errors.venue?.name)}
                    helperText={errors.venue?.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="venue.address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Street Address"
                    variant="outlined"
                    error={Boolean(errors.venue?.address)}
                    helperText={errors.venue?.address?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="venue.city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="City"
                    variant="outlined"
                    error={Boolean(errors.venue?.city)}
                    helperText={errors.venue?.city?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Controller
                name="venue.state"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="State"
                    variant="outlined"
                    error={Boolean(errors.venue?.state)}
                    helperText={errors.venue?.state?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Controller
                name="venue.zipCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="ZIP Code"
                    variant="outlined"
                    error={Boolean(errors.venue?.zipCode)}
                    helperText={errors.venue?.zipCode?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <LocationPicker
                value={watch('venue.coordinates')}
                onChange={(coords) => setValue('venue.coordinates', coords)}
                address={watch('venue.address')}
                error={Boolean(errors.venue?.coordinates)}
                helperText={errors.venue?.coordinates?.message}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Additional Details
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="coverImage"
                control={control}
                render={({ field }) => (
                  <FileUpload
                    label="Cover Image"
                    accept="image/*"
                    value={field.value}
                    onChange={field.onChange}
                    error={Boolean(errors.coverImage)}
                    helperText={errors.coverImage?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    label="Tags (comma separated)"
                    variant="outlined"
                    value={field.value.join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter((tag) => tag);
                      field.onChange(tags);
                    }}
                    helperText="Add tags to help volunteers find your event"
                  />
                )}
              />
              <Box mt={1}>
                {watch('tags').map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                    onDelete={() => {
                      const newTags = [...watch('tags')];
                      newTags.splice(index, 1);
                      setValue('tags', newTags);
                    }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <form onSubmit={handleSubmit(onSubmit)}>
        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>

          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || isSubmitting}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {event ? 'Update Event' : 'Create Event'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

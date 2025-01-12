import { api } from './api';

export const eventsAPI = {
    // Get all events with optional filters
    getEvents: async (filters = {}) => {
        try {
            console.log('getEvents called with filters:', filters);
            const queryParams = new URLSearchParams();
            
            // Only add non-empty filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    queryParams.append(key, value);
                }
            });

            const queryString = queryParams.toString();
            const url = `/events/${queryString ? `?${queryString}` : ''}`;
            console.log('Making request to:', url);
            
            const response = await api.get(url);
            console.log('Raw API response:', response);
            
            // Check if response exists and has data
            if (!response || !response.data) {
                console.warn('No data in response');
                return [];
            }
            
            // Handle both array and object responses
            let events = [];
            if (Array.isArray(response.data)) {
                events = response.data;
            } else if (response.data.results && Array.isArray(response.data.results)) {
                events = response.data.results;
            } else if (typeof response.data === 'object') {
                // If it's a single event object, wrap it in an array
                events = [response.data];
            }
            
            console.log('Processed events data:', events);
            return events;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    },

    // Get a single event by ID
    getEvent: (eventId) => api.get(`/events/${eventId}/`),

    // Create a new event
    createEvent: async (eventData) => {
        try {
            const formData = new FormData();
            Object.keys(eventData).forEach(key => {
                if (eventData[key] !== null && eventData[key] !== undefined) {
                    if (key === 'image' && eventData[key] instanceof File) {
                        formData.append(key, eventData[key]);
                    } else if (typeof eventData[key] === 'boolean') {
                        formData.append(key, eventData[key].toString());
                    } else if (key.includes('date') && eventData[key]) {
                        // Ensure dates are in ISO format
                        formData.append(key, new Date(eventData[key]).toISOString());
                    } else {
                        formData.append(key, eventData[key]);
                    }
                }
            });
            const response = await api.post('/events/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    },

    // Update an existing event
    updateEvent: async (eventId, eventData) => {
        try {
            const formData = new FormData();
            Object.keys(eventData).forEach(key => {
                if (eventData[key] !== null && eventData[key] !== undefined) {
                    if (key === 'image' && eventData[key] instanceof File) {
                        formData.append(key, eventData[key]);
                    } else if (typeof eventData[key] === 'boolean') {
                        formData.append(key, eventData[key].toString());
                    } else if (key.includes('date') && eventData[key]) {
                        // Ensure dates are in ISO format
                        formData.append(key, new Date(eventData[key]).toISOString());
                    } else {
                        formData.append(key, eventData[key]);
                    }
                }
            });
            const response = await api.patch(`/events/${eventId}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    },

    // Delete an event
    deleteEvent: (eventId) => api.delete(`/events/${eventId}/`),

    // Register for an event
    registerForEvent: (eventId) => api.post(`/events/${eventId}/register/`),

    // Cancel registration for an event
    cancelRegistration: (eventId) => api.post(`/events/${eventId}/cancel_registration/`),

    // Get registrations for an event (organizer only)
    getEventRegistrations: (eventId) => api.get(`/events/${eventId}/registrations/`),

    // Get user's registered events
    getMyEvents: () => api.get('/events/my_events/'),

    // Get user's event registrations
    getMyRegistrations: () => api.get('/registrations/'),
}; 
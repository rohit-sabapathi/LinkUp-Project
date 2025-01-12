import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../../services/eventsApi';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MagnifyingGlassIcon, CalendarIcon, MapPinIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        event_type: '',
        start_after: '',
        start_before: '',
        is_virtual: '',
    });
    const { user } = useAuth();

    // Initial load
    useEffect(() => {
        console.log('Initial load - fetching all events');
        fetchEvents();  // No filters on initial load
    }, []); // Empty dependency array for initial load

    // Handle filter changes
    useEffect(() => {
        console.log('Filters changed:', filters);
        // Only fetch if this is a user-initiated filter change
        const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== null && value !== undefined);
        if (hasActiveFilters) {
            console.log('Active filters detected - fetching filtered events');
            fetchEvents(filters);
        }
    }, [filters]); // Re-fetch when filters change

    const fetchEvents = async (queryFilters = {}) => {
        try {
            setLoading(true);
            console.log('Fetching events with queryFilters:', queryFilters);
            
            const data = await eventsAPI.getEvents(queryFilters);
            console.log('Fetched events data:', data);
            
            if (Array.isArray(data)) {
                setEvents(data);
                console.log('Events set to:', data);
            } else {
                console.warn('Received non-array data:', data);
                setEvents([]);
            }
            
            if (!data || data.length === 0) {
                console.log('No events found');
                // Only show toast for user-initiated searches
                if (Object.values(queryFilters).some(val => val)) {
                    toast.info('No events found matching your criteria');
                }
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
            toast.error('Failed to load events. Please try again later.');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        console.log(`Filter changed: ${name} = ${value}`);
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Search submitted with filters:', filters);
        fetchEvents(filters);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-8">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Search events by title, description, or location..."
                                className="w-full bg-slate-700 text-slate-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Search
                    </button>
                </div>
            </form>

            {/* Filters */}
            <div className="mb-8 bg-slate-800 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-slate-200">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select
                        name="event_type"
                        value={filters.event_type}
                        onChange={handleFilterChange}
                        className="bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Event Types</option>
                        <option value="webinar">Webinar</option>
                        <option value="workshop">Workshop</option>
                        <option value="conference">Conference</option>
                        <option value="networking">Networking Event</option>
                        <option value="reunion">Alumni Reunion</option>
                        <option value="other">Other</option>
                    </select>

                    <input
                        type="date"
                        name="start_after"
                        value={filters.start_after}
                        onChange={handleFilterChange}
                        className="bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="date"
                        name="start_before"
                        value={filters.start_before}
                        onChange={handleFilterChange}
                        className="bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <select
                        name="is_virtual"
                        value={filters.is_virtual}
                        onChange={handleFilterChange}
                        className="bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Locations</option>
                        <option value="true">Virtual Events</option>
                        <option value="false">Physical Events</option>
                    </select>
                </div>
            </div>

            {/* Create Event Button */}
            <Link
                to="/events/create"
                className="inline-block mb-8 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
                Create Event
            </Link>

            {/* Events List */}
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <div key={event.id} className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <Link
                                        to={`/events/${event.id}`}
                                        className="text-xl font-semibold text-slate-200 mb-2 hover:text-blue-400"
                                    >
                                        {event.title}
                                    </Link>
                                    <div className="flex items-center gap-4 text-slate-400 text-sm mt-2">
                                        <div className="flex items-center gap-1">
                                            <CalendarIcon className="h-4 w-4" />
                                            {format(new Date(event.start_date), 'MMM d, yyyy h:mm a')}
                                        </div>
                                        {event.is_virtual ? (
                                            <div className="flex items-center gap-1">
                                                <VideoCameraIcon className="h-4 w-4" />
                                                Virtual Event
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <MapPinIcon className="h-4 w-4" />
                                                {event.location}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 my-4">
                                        <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm">
                                            {event.event_type}
                                        </span>
                                        {event.is_full && (
                                            <span className="bg-red-900 text-red-100 px-3 py-1 rounded-full text-sm">
                                                Full
                                            </span>
                                        )}
                                        {event.user_registration_status && (
                                            <span className="bg-green-900 text-green-100 px-3 py-1 rounded-full text-sm">
                                                {event.user_registration_status}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-300 line-clamp-2">{event.description}</p>
                                </div>
                                {event.image && (
                                    <div className="ml-6">
                                        <img
                                            src={event.image}
                                            alt={event.title}
                                            className="w-32 h-32 object-cover rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end mt-4">
                                <Link
                                    to={`/events/${event.id}`}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-slate-400">No events found. Try adjusting your filters or create a new event.</p>
                    {user && (
                        <Link
                            to="/events/create"
                            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create Event
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventList; 
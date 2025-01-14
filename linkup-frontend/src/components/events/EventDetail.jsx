import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../../services/eventsApi';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
    CalendarIcon,
    MapPinIcon,
    VideoCameraIcon,
    UserGroupIcon,
    ClockIcon,
    PencilIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registrations, setRegistrations] = useState([]);
    const [showRegistrations, setShowRegistrations] = useState(false);

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            setLoading(true);
            const response = await eventsAPI.getEvent(id);
            setEvent(response.data);
            if (response.data.organizer === user?.id) {
                fetchRegistrations();
            }
        } catch (error) {
            console.error('Failed to fetch event:', error);
            toast.error('Failed to load event details');
            navigate('/events');
        } finally {
            setLoading(false);
        }
    };

    const fetchRegistrations = async () => {
        try {
            const response = await eventsAPI.getEventRegistrations(id);
            setRegistrations(response.data);
        } catch (error) {
            console.error('Failed to fetch registrations:', error);
        }
    };

    const handleRegister = async () => {
        try {
            await eventsAPI.registerForEvent(id);
            toast.success('Successfully registered for event');
            fetchEvent();
        } catch (error) {
            console.error('Failed to register:', error);
            toast.error(error.response?.data?.detail || 'Failed to register for event');
        }
    };

    const handleCancelRegistration = async () => {
        try {
            await eventsAPI.cancelRegistration(id);
            toast.success('Successfully cancelled registration');
            fetchEvent();
        } catch (error) {
            console.error('Failed to cancel registration:', error);
            toast.error(error.response?.data?.detail || 'Failed to cancel registration');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await eventsAPI.deleteEvent(id);
                toast.success('Event deleted successfully');
                navigate('/events');
            } catch (error) {
                console.error('Failed to delete event:', error);
                toast.error('Failed to delete event');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!event) {
        return null;
    }

    const isOrganizer = event.organizer === user?.id;
    const canRegister = !event.is_past && !event.is_full && !event.user_registration_status;
    const isRegistered = event.user_registration_status === 'registered';
    const isWaitlisted = event.user_registration_status === 'waitlisted';

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-slate-800 rounded-lg p-8">
                {/* Event Header */}
                <div className="flex justify-between items-start mb-6">
                    <h1 className="text-3xl font-bold text-slate-200">{event.title}</h1>
                    {isOrganizer && (
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate(`/events/${id}/edit`)}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <PencilIcon className="h-5 w-5" />
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <TrashIcon className="h-5 w-5" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* Event Image */}
                {event.image && (
                    <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-64 object-cover rounded-lg mb-6"
                    />
                )}

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-300">
                                <CalendarIcon className="h-5 w-5" />
                                <div>
                                    <div>Starts: {format(new Date(event.start_date), 'MMM d, yyyy h:mm a')}</div>
                                    <div>Ends: {format(new Date(event.end_date), 'MMM d, yyyy h:mm a')}</div>
                                </div>
                            </div>

                            {event.is_virtual ? (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <VideoCameraIcon className="h-5 w-5" />
                                    <span>Virtual Event</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <MapPinIcon className="h-5 w-5" />
                                    <span>{event.location}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-slate-300">
                                <UserGroupIcon className="h-5 w-5" />
                                <span>
                                    {event.registered_participants_count} registered
                                    {event.max_participants && ` (max ${event.max_participants})`}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-300">
                                <ClockIcon className="h-5 w-5" />
                                <span>
                                    Registration deadline: {format(new Date(event.registration_deadline), 'MMM d, yyyy h:mm a')}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h2 className="text-xl font-semibold text-slate-200 mb-2">Description</h2>
                            <p className="text-slate-300 whitespace-pre-wrap">{event.description}</p>
                        </div>

                        {event.is_virtual && isRegistered && (
                            <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                                <h2 className="text-xl font-semibold text-slate-200 mb-2">Meeting Details</h2>
                                <div className="space-y-2 text-slate-300">
                                    <p>Meeting Link: <a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{event.meeting_link}</a></p>
                                    {event.meeting_id && <p>Meeting ID: {event.meeting_id}</p>}
                                    {event.meeting_password && <p>Password: {event.meeting_password}</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        {/* Registration Status and Actions */}
                        <div className="bg-slate-700 rounded-lg p-6 mb-6">
                            <h2 className="text-xl font-semibold text-slate-200 mb-4">Registration</h2>
                            {event.is_past ? (
                                <div className="text-slate-400">This event has ended</div>
                            ) : event.is_full && !isRegistered ? (
                                <div className="text-slate-400">This event is full</div>
                            ) : isRegistered ? (
                                <div>
                                    <div className="text-green-400 mb-4">You are registered for this event</div>
                                    <button
                                        onClick={handleCancelRegistration}
                                        className="w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Cancel Registration
                                    </button>
                                </div>
                            ) : isWaitlisted ? (
                                <div>
                                    <div className="text-yellow-400 mb-4">You are on the waitlist</div>
                                    <button
                                        onClick={handleCancelRegistration}
                                        className="w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Leave Waitlist
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleRegister}
                                    className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    disabled={!canRegister}
                                >
                                    Register for Event
                                </button>
                            )}
                        </div>

                        {/* Registrations List (for organizer) */}
                        {isOrganizer && (
                            <div className="bg-slate-700 rounded-lg p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-slate-200">Registrations</h2>
                                    <button
                                        onClick={() => setShowRegistrations(!showRegistrations)}
                                        className="text-blue-400 hover:text-blue-300"
                                    >
                                        {showRegistrations ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {showRegistrations && (
                                    <div className="space-y-4">
                                        {registrations.map(registration => (
                                            <div
                                                key={registration.id}
                                                className="flex justify-between items-center p-3 bg-slate-800 rounded-lg"
                                            >
                                                <div>
                                                    <div className="text-slate-200">{registration.participant_name}</div>
                                                    <div className="text-slate-400 text-sm">{registration.participant_email}</div>
                                                </div>
                                                <div className="text-slate-300">{registration.status}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail; 
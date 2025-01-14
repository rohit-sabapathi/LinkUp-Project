import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsAPI } from '../../services/eventsApi';
import { toast } from 'react-hot-toast';

const EventForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(isEditing);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_type: '',
        start_date: '',
        end_date: '',
        location: '',
        is_virtual: false,
        max_participants: '',
        registration_deadline: '',
        image: null,
        meeting_link: '',
        meeting_id: '',
        meeting_password: '',
    });

    useEffect(() => {
        if (isEditing) {
            fetchEvent();
        }
    }, [id]);

    const fetchEvent = async () => {
        try {
            const response = await eventsAPI.getEvent(id);
            const event = response.data;
            setFormData({
                ...event,
                start_date: event.start_date.slice(0, 16), // Format for datetime-local input
                end_date: event.end_date.slice(0, 16),
                registration_deadline: event.registration_deadline.slice(0, 16),
                image: null, // Don't set the image file
            });
            setImagePreview(event.image);
        } catch (error) {
            console.error('Failed to fetch event:', error);
            toast.error('Failed to load event details');
            navigate('/events');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            const file = files[0];
            setFormData(prev => ({
                ...prev,
                [name]: file
            }));
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                };
                reader.readAsDataURL(file);
            }
        } else if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await eventsAPI.updateEvent(id, formData);
                toast.success('Event updated successfully');
            } else {
                await eventsAPI.createEvent(formData);
                toast.success('Event created successfully');
            }
            navigate('/events');
        } catch (error) {
            console.error('Failed to save event:', error);
            toast.error(error.response?.data?.detail || 'Failed to save event');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto bg-slate-800 rounded-lg p-8">
                <h1 className="text-2xl font-bold text-slate-200 mb-6">
                    {isEditing ? 'Edit Event' : 'Create Event'}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-300">
                            Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-300">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Event Type */}
                    <div>
                        <label htmlFor="event_type" className="block text-sm font-medium text-slate-300">
                            Event Type
                        </label>
                        <select
                            id="event_type"
                            name="event_type"
                            value={formData.event_type}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Event Type</option>
                            <option value="webinar">Webinar</option>
                            <option value="workshop">Workshop</option>
                            <option value="conference">Conference</option>
                            <option value="networking">Networking Event</option>
                            <option value="reunion">Alumni Reunion</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="start_date" className="block text-sm font-medium text-slate-300">
                                Start Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                id="start_date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="end_date" className="block text-sm font-medium text-slate-300">
                                End Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                id="end_date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="registration_deadline" className="block text-sm font-medium text-slate-300">
                                Registration Deadline
                            </label>
                            <input
                                type="datetime-local"
                                id="registration_deadline"
                                name="registration_deadline"
                                value={formData.registration_deadline}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Virtual Event Toggle */}
                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="is_virtual"
                                checked={formData.is_virtual}
                                onChange={handleChange}
                                className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-slate-300">This is a virtual event</span>
                        </label>
                    </div>

                    {/* Location or Virtual Meeting Details */}
                    {formData.is_virtual ? (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="meeting_link" className="block text-sm font-medium text-slate-300">
                                    Meeting Link
                                </label>
                                <input
                                    type="url"
                                    id="meeting_link"
                                    name="meeting_link"
                                    value={formData.meeting_link}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="meeting_id" className="block text-sm font-medium text-slate-300">
                                    Meeting ID (optional)
                                </label>
                                <input
                                    type="text"
                                    id="meeting_id"
                                    name="meeting_id"
                                    value={formData.meeting_id}
                                    onChange={handleChange}
                                    className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="meeting_password" className="block text-sm font-medium text-slate-300">
                                    Meeting Password (optional)
                                </label>
                                <input
                                    type="text"
                                    id="meeting_password"
                                    name="meeting_password"
                                    value={formData.meeting_password}
                                    onChange={handleChange}
                                    className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-slate-300">
                                Location
                            </label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                required={!formData.is_virtual}
                                className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    {/* Max Participants */}
                    <div>
                        <label htmlFor="max_participants" className="block text-sm font-medium text-slate-300">
                            Maximum Participants (optional)
                        </label>
                        <input
                            type="number"
                            id="max_participants"
                            name="max_participants"
                            value={formData.max_participants}
                            onChange={handleChange}
                            min="1"
                            className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label htmlFor="image" className="block text-sm font-medium text-slate-300">
                            Event Image (optional)
                        </label>
                        <input
                            type="file"
                            id="image"
                            name="image"
                            onChange={handleChange}
                            accept="image/*"
                            className="mt-1 block w-full text-slate-300"
                        />
                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="mt-2 h-32 w-auto object-cover rounded-lg"
                            />
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/events')}
                            className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {isEditing ? 'Update Event' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventForm; 
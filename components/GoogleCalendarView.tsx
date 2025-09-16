import React, { useState, useEffect } from 'react';
import { CalendarEvent, GoogleCalendarConfig } from '../types';
// FIX: 'startOfWeek', 'startOfMonth', and 'parseISO' are not direct exports. Import them from their submodules.
import { format, addDays, endOfMonth, endOfWeek, isSameMonth, isToday, isSameDay } from 'date-fns';
import startOfWeek from 'date-fns/startOfWeek';
import startOfMonth from 'date-fns/startOfMonth';
import parseISO from 'date-fns/parseISO';
import { fetchCalendarEvents, saveCalendarEvent, deleteCalendarEvent, fetchGoogleCalendarConfig } from '../services/api';
import Modal from './Modal';

const CalendarHeader: React.FC<{ currentDate: Date; onMonthChange: (offset: number) => void; onAdd: () => void; }> = ({ currentDate, onMonthChange, onAdd }) => (
    <div className="flex items-center justify-between mt-6 mb-4">
        <div className="flex items-center gap-4">
            <button onClick={() => onMonthChange(-1)} className="p-2 rounded-md hover:bg-gray-700 transition text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-200">{format(currentDate, 'MMMM yyyy')}</h2>
            <button onClick={() => onMonthChange(1)} className="p-2 rounded-md hover:bg-gray-700 transition text-gray-300">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
        <button onClick={onAdd} className="px-4 py-2 bg-yellow-500 text-gray-900 font-semibold rounded-md hover:bg-yellow-600 transition">Add Appointment</button>
    </div>
);

const CalendarGrid: React.FC<{ currentDate: Date; events: CalendarEvent[]; onDayClick: (date: Date) => void; onEventClick: (event: CalendarEvent) => void; }> = ({ currentDate, events, onDayClick, onEventClick }) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;
    while (day <= endDate) {
        days.push(day);
        day = addDays(day, 1);
    }
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0 border-t border-l border-gray-700">
            {dayNames.map(dayName => (
                <div key={dayName} className="text-center font-bold text-gray-400 py-2 border-b-2 border-gray-700 bg-gray-800">{dayName}</div>
            ))}
            {days.map(d => {
                const dayEvents = events.filter(e => isSameDay(parseISO(e.start as any), d));
                return (
                    <div key={d.toString()} onClick={() => onDayClick(d)} className={`border-r border-b border-gray-700 p-2 flex flex-col cursor-pointer transition-colors ${isSameMonth(d, monthStart) ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-800 bg-opacity-50 hover:bg-gray-700'}`}>
                        <span className={`text-sm self-end ${!isSameMonth(d, monthStart) ? 'text-gray-600' : ''} ${isToday(d) ? 'font-bold bg-yellow-400 text-black rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-200'}`}>
                            {format(d, 'd')}
                        </span>
                        <div className="mt-1 space-y-1 overflow-y-auto">
                           {dayEvents.map(event => (
                               <button key={event.id} onClick={(e) => { e.stopPropagation(); onEventClick(event); }} className="block w-full text-left text-xs p-1 bg-yellow-900 bg-opacity-50 text-yellow-200 rounded-md truncate hover:bg-opacity-75">
                                   {event.title}
                               </button>
                           ))}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};


const GoogleCalendarView: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Omit<CalendarEvent, 'id' | 'start' | 'end'> & { id?: string; start: string; end: string } | null>(null);
    const [googleConfig, setGoogleConfig] = useState<GoogleCalendarConfig>({ connected: false });

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [calendarEvents, config] = await Promise.all([
                fetchCalendarEvents(),
                fetchGoogleCalendarConfig(),
            ]);
            setEvents(calendarEvents.map(e => ({...e, start: new Date(e.start), end: new Date(e.end)})));
            setGoogleConfig(config);
        } catch (error) {
            console.error("Failed to load calendar data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);
    
    const handleMonthChange = (offset: number) => {
        setCurrentDate(prev => addDays(startOfMonth(prev), offset * 30));
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
    };

    const handleOpenModal = (event: CalendarEvent | null, date: Date | null = null) => {
        if (event) {
            setSelectedEvent({
                ...event,
                start: format(new Date(event.start), "yyyy-MM-dd'T'HH:mm"),
                end: format(new Date(event.end), "yyyy-MM-dd'T'HH:mm"),
            });
        } else {
             const defaultStartTime = date ? new Date(date) : new Date();
             defaultStartTime.setHours(9,0,0,0);
             const defaultEndTime = new Date(defaultStartTime.getTime() + 60 * 60 * 1000); // 1 hour later
            setSelectedEvent({
                title: '',
                customerName: '',
                service: '',
                start: format(defaultStartTime, "yyyy-MM-dd'T'HH:mm"),
                end: format(defaultEndTime, "yyyy-MM-dd'T'HH:mm"),
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!selectedEvent) return;
        try {
            const eventToSave = {
                ...selectedEvent,
                start: parseISO(selectedEvent.start),
                end: parseISO(selectedEvent.end)
            };
            await saveCalendarEvent(eventToSave);
            handleCloseModal();
            loadData(); // Refresh events
        } catch (error) {
            console.error("Failed to save event", error);
        }
    };
    
    const handleDelete = async () => {
        if (!selectedEvent || !selectedEvent.id) return;
        if (window.confirm('Are you sure you want to delete this appointment?')) {
            try {
                await deleteCalendarEvent(selectedEvent.id);
                handleCloseModal();
                loadData(); // Refresh events
            } catch (error) {
                console.error("Failed to delete event", error);
            }
        }
    };

    if (isLoading) {
        return <div className="flex-1 p-8 flex justify-center items-center text-gray-400"><p>Loading Calendar...</p></div>;
    }
    
    if (!googleConfig.connected) {
        return (
            <div className="flex-1 p-8 flex flex-col justify-center items-center text-center bg-gray-900">
                <h2 className="text-2xl font-bold text-white">Google Calendar Not Connected</h2>
                <p className="mt-2 text-gray-400">To manage your appointments, you first need to connect your Google Calendar account.</p>
                <p className="mt-4 text-sm text-gray-500">(This feature requires configuration in the main app settings)</p>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 bg-gray-900 flex flex-col">
            <h1 className="text-3xl font-bold text-white">Appointments Calendar</h1>
            <p className="mt-1 text-gray-400">View and manage your schedule. Connected as <span className="font-semibold text-yellow-300">{googleConfig.userEmail}</span>.</p>
            
            <CalendarHeader currentDate={currentDate} onMonthChange={handleMonthChange} onAdd={() => handleOpenModal(null)} />
            
            <CalendarGrid currentDate={currentDate} events={events} onDayClick={(date) => handleOpenModal(null, date)} onEventClick={(event) => handleOpenModal(event)} />

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedEvent?.id ? "Edit Appointment" : "Add Appointment"}>
                {selectedEvent && (
                    <div className="space-y-4 text-gray-300">
                         <div>
                            <label className="block text-sm font-medium">Title</label>
                            <input type="text" value={selectedEvent.title} onChange={e => setSelectedEvent({ ...selectedEvent, title: e.target.value })} className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Customer Name</label>
                            <input type="text" value={selectedEvent.customerName || ''} onChange={e => setSelectedEvent({ ...selectedEvent, customerName: e.target.value })} className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Service</label>
                            <input type="text" value={selectedEvent.service || ''} onChange={e => setSelectedEvent({ ...selectedEvent, service: e.target.value })} className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Start</label>
                            <input type="datetime-local" value={selectedEvent.start} onChange={e => setSelectedEvent({ ...selectedEvent, start: e.target.value })} className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium">End</label>
                            <input type="datetime-local" value={selectedEvent.end} onChange={e => setSelectedEvent({ ...selectedEvent, end: e.target.value })} className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                        </div>
                        <div className="flex justify-between mt-6">
                            {selectedEvent.id && <button onClick={handleDelete} className="px-4 py-2 font-semibold rounded-md text-red-400 hover:bg-red-500 hover:text-white transition">Delete</button>}
                            <button onClick={handleSave} className="px-4 py-2 font-semibold rounded-md bg-yellow-500 text-gray-900 hover:bg-yellow-600 transition ml-auto">Save Appointment</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default GoogleCalendarView;
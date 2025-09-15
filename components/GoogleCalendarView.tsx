import React, { useState, useMemo } from 'react';
import { CalendarEvent } from '../types';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isToday, parseISO } from 'date-fns';

// Mock API call - in a real app, this would fetch from your backend
const fetchCalendarEvents = async (start: Date, end: Date): Promise<CalendarEvent[]> => {
    console.log(`Fetching events from ${start.toISOString()} to ${end.toISOString()}`);
    // This is where you would call your backend API, e.g., `${BASE_URL}/calendar/events?start=${...}&end=${...}`
    // For now, let's return some mock events for demonstration
    return [
        { id: '1', title: 'Botox - Ana Garcia', start: new Date(), end: addDays(new Date(), 1) },
        { id: '2', title: 'Facial - Maria Rodriguez', start: addDays(new Date(), 2), end: addDays(new Date(), 3) },
    ];
};

const CalendarHeader: React.FC<{ currentDate: Date; onMonthChange: (offset: number) => void }> = ({ currentDate, onMonthChange }) => (
    <div className="flex items-center justify-between mt-6 mb-4">
        <div className="flex items-center gap-4">
            <button onClick={() => onMonthChange(-1)} className="p-2 rounded-md hover:bg-gray-700 transition text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-200">{format(currentDate, 'MMMM yyyy')}</h2>
            <button onClick={() => onMonthChange(1)} className="p-2 rounded-md hover:bg-gray-700 transition text-gray-300">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
        <button className="px-4 py-2 bg-yellow-500 text-gray-900 font-semibold rounded-md hover:bg-yellow-600 transition">Add Appointment</button>
    </div>
);

const CalendarGrid: React.FC<{ currentDate: Date; events: CalendarEvent[] }> = ({ currentDate, events }) => {
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
        <div className="grid grid-cols-7 flex-1 min-h-0 border-t border-l border-gray-700">
            {dayNames.map(dayName => (
                <div key={dayName} className="text-center font-bold text-gray-400 py-2 border-b-2 border-gray-700 bg-gray-800">{dayName}</div>
            ))}
            {days.map(d => (
                <div key={d.toString()} className={`border-r border-b border-gray-700 p-2 flex flex-col ${isSameMonth(d, monthStart) ? 'bg-gray-800' : 'bg-gray-800 bg-opacity-50'}`}>
                    <span className={`text-sm ${!isSameMonth(d, monthStart) ? 'text-gray-600' : ''} ${isToday(d) ? 'font-bold text-yellow-400' : 'text-gray-200'}`}>
                        {format(d, 'd')}
                    </span>
                    {/* Event rendering would go here */}
                </div>
            ))}
        </div>
    );
};


const GoogleCalendarView: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const handleMonthChange = (offset: number) => {
        setCurrentDate(prev => addDays(startOfMonth(prev), offset * 30)); // Simple month change
    };

    // Effect to fetch events when the date range changes
    useMemo(() => {
        const loadEvents = async () => {
            setIsLoading(true);
            const monthStart = startOfMonth(currentDate);
            const monthEnd = endOfMonth(currentDate);
            const fetchedEvents = await fetchCalendarEvents(startOfWeek(monthStart), endOfWeek(monthEnd));
            setEvents(fetchedEvents);
            setIsLoading(false);
        };
        loadEvents();
    }, [currentDate]);


    return (
        <div className="flex-1 p-8 bg-gray-900 flex flex-col">
            <h1 className="text-3xl font-bold text-white">Appointments Calendar</h1>
            <p className="mt-1 text-gray-400">View and manage your schedule via Google Calendar.</p>
            
            <CalendarHeader currentDate={currentDate} onMonthChange={handleMonthChange} />
            
            {isLoading ? (
                <div className="flex-1 flex justify-center items-center text-gray-400">Loading events...</div>
            ) : (
                <CalendarGrid currentDate={currentDate} events={events} />
            )}
        </div>
    );
};

export default GoogleCalendarView;
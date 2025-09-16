import { Conversation, AutomationRule, Service, PlatformConnection, AiConfig, WebhookConfig, Message, GoogleCalendarConfig, CalendarEvent } from '../types';

const BASE_URL = 'https://metaluxe-backend.onrender.com/api';

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        if (response.status === 204) return {} as T; // Handle no content for DELETE
        const error = await response.text();
        throw new Error(`API Error: ${response.status} ${error}`);
    }
    return response.json();
};

// --- Data Fetching ---

export const fetchConversations = (): Promise<Conversation[]> => {
    return fetch(`${BASE_URL}/conversations`).then(response => handleResponse<Conversation[]>(response));
};

export const fetchAutomationRules = (): Promise<AutomationRule[]> => {
    return fetch(`${BASE_URL}/automation-rules`).then(response => handleResponse<AutomationRule[]>(response));
};

export const fetchServices = (): Promise<Service[]> => {
    return fetch(`${BASE_URL}/services`).then(response => handleResponse<Service[]>(response));
};

// --- Message Sending ---

export const sendMessage = (conversationId: string, text: string): Promise<Message> => {
    return fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    }).then(response => handleResponse<Message>(response));
};


// --- Configuration Management ---

export const fetchPlatformConnections = (): Promise<PlatformConnection[]> => {
    return fetch(`${BASE_URL}/connections`).then(response => handleResponse<PlatformConnection[]>(response));
};

export const savePlatformConnection = (connection: PlatformConnection): Promise<{ message: string }> => {
    return fetch(`${BASE_URL}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection)
    }).then(response => handleResponse<{ message: string }>(response));
};

export const fetchAiConfig = (): Promise<AiConfig> => {
    return fetch(`${BASE_URL}/ai-config`).then(response => handleResponse<AiConfig>(response));
};

export const saveAiConfig = (config: AiConfig): Promise<{ message: string }> => {
    return fetch(`${BASE_URL}/ai-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    }).then(response => handleResponse<{ message: string }>(response));
};

export const fetchWebhookConfig = (): Promise<WebhookConfig> => {
    return fetch(`${BASE_URL}/webhook-config`).then(response => handleResponse<WebhookConfig>(response));
};

export const saveWebhookConfig = (config: Partial<WebhookConfig>): Promise<{ message: string }> => {
    return fetch(`${BASE_URL}/webhook-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    }).then(response => handleResponse<{ message: string }>(response));
};

// --- Google Calendar ---
export const fetchGoogleCalendarConfig = (): Promise<GoogleCalendarConfig> => {
    return fetch(`${BASE_URL}/google-calendar/config`).then(handleResponse);
};
// FIX: Explicitly pass the generic type to handleResponse to fix type inference issues.
export const connectGoogleCalendar = (): Promise<GoogleCalendarConfig> => {
    return fetch(`${BASE_URL}/google-calendar/connect`, { method: 'POST' }).then(response => handleResponse<GoogleCalendarConfig>(response));
};
// FIX: Explicitly pass the generic type to handleResponse to fix type inference issues.
export const disconnectGoogleCalendar = (): Promise<GoogleCalendarConfig> => {
    return fetch(`${BASE_URL}/google-calendar/disconnect`, { method: 'POST' }).then(response => handleResponse<GoogleCalendarConfig>(response));
};
export const fetchCalendarEvents = (): Promise<CalendarEvent[]> => {
    return fetch(`${BASE_URL}/calendar-events`).then(response => handleResponse<CalendarEvent[]>(response));
};
export const saveCalendarEvent = (event: Omit<CalendarEvent, 'id'> & { id?: string }): Promise<CalendarEvent> => {
    const isUpdating = !!event.id;
    const url = isUpdating ? `${BASE_URL}/calendar-events/${event.id}` : `${BASE_URL}/calendar-events`;
    const method = isUpdating ? 'PUT' : 'POST';
    return fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
    }).then(response => handleResponse<CalendarEvent>(response));
};
export const deleteCalendarEvent = (eventId: string): Promise<void> => {
    return fetch(`${BASE_URL}/calendar-events/${eventId}`, { method: 'DELETE' }).then(response => handleResponse<void>(response));
};


// --- Automation CRUD ---

export const saveAutomationRule = (rule: Omit<AutomationRule, 'id'> & { id?: string }): Promise<AutomationRule> => {
    const isUpdating = !!rule.id;
    const url = isUpdating ? `${BASE_URL}/automation-rules/${rule.id}` : `${BASE_URL}/automation-rules`;
    const method = isUpdating ? 'PUT' : 'POST';
    return fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
    }).then(response => handleResponse<AutomationRule>(response));
};

export const deleteAutomationRule = (ruleId: string): Promise<void> => {
    return fetch(`${BASE_URL}/automation-rules/${ruleId}`, {
        method: 'DELETE'
    }).then(response => handleResponse<void>(response));
};

export const saveService = (service: Omit<Service, 'id'> & { id?: string }): Promise<Service> => {
    const isUpdating = !!service.id;
    const url = isUpdating ? `${BASE_URL}/services/${service.id}` : `${BASE_URL}/services`;
    const method = isUpdating ? 'PUT' : 'POST';
    return fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service)
    }).then(response => handleResponse<Service>(response));
};

export const deleteService = (serviceId: string): Promise<void> => {
    return fetch(`${BASE_URL}/services/${serviceId}`, {
        method: 'DELETE'
    }).then(response => handleResponse<void>(response));
};

export const fetchAutomationConfig = (): Promise<{ welcomeMessage: string }> => {
    return fetch(`${BASE_URL}/automation-config`).then(response => handleResponse<{ welcomeMessage: string }>(response));
};

export const saveAutomationConfig = (config: { welcomeMessage: string }): Promise<{ message: string }> => {
    return fetch(`${BASE_URL}/automation-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    }).then(response => handleResponse<{ message: string }>(response));
};
import { Conversation, AutomationRule, Service, PlatformConnection, AiConfig, WebhookConfig } from '../types';

const BASE_URL = 'https://metaluxe-backend.onrender.com/api';

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} ${error}`);
    }
    return response.json();
};

// --- Data Fetching (would be from real APIs in production) ---

export const fetchConversations = (): Promise<Conversation[]> => {
    // FIX: Explicitly typed the generic for handleResponse to ensure the correct return type.
    return fetch(`${BASE_URL}/conversations`).then(response => handleResponse<Conversation[]>(response));
};

export const fetchAutomationRules = (): Promise<AutomationRule[]> => {
    // FIX: Explicitly typed the generic for handleResponse to ensure the correct return type.
    return fetch(`${BASE_URL}/automation-rules`).then(response => handleResponse<AutomationRule[]>(response));
};

export const fetchServices = (): Promise<Service[]> => {
    // FIX: Explicitly typed the generic for handleResponse to ensure the correct return type.
    return fetch(`${BASE_URL}/services`).then(response => handleResponse<Service[]>(response));
};

// --- Configuration Management ---

export const fetchPlatformConnections = (): Promise<PlatformConnection[]> => {
    // FIX: Explicitly typed the generic for handleResponse to ensure the correct return type.
    return fetch(`${BASE_URL}/connections`).then(response => handleResponse<PlatformConnection[]>(response));
};

export const savePlatformConnection = (connection: PlatformConnection): Promise<{ message: string }> => {
    // FIX: Explicitly typed the generic for handleResponse to ensure the correct return type.
    return fetch(`${BASE_URL}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection)
    }).then(response => handleResponse<{ message: string }>(response));
};

export const fetchAiConfig = (): Promise<AiConfig> => {
    // FIX: Explicitly typed the generic for handleResponse to ensure the correct return type.
    return fetch(`${BASE_URL}/ai-config`).then(response => handleResponse<AiConfig>(response));
};

export const saveAiConfig = (config: AiConfig): Promise<{ message: string }> => {
    // FIX: Explicitly typed the generic for handleResponse to ensure the correct return type.
    return fetch(`${BASE_URL}/ai-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    }).then(response => handleResponse<{ message: string }>(response));
};

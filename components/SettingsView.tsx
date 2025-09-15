import React, { useState, useEffect, useCallback } from 'react';
import { ConnectablePlatform, PlatformConnection, AiConfig, WebhookConfig, GoogleCalendarConfig } from '../types';
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon, LinkIcon, CogIcon, GoogleIcon, CalendarIcon } from './Icons';
import { fetchPlatformConnections, savePlatformConnection, fetchAiConfig, saveAiConfig, fetchWebhookConfig, saveWebhookConfig } from '../services/api';

const platformIcons: Record<ConnectablePlatform, React.ReactNode> = {
    Facebook: <FacebookIcon className="w-8 h-8 text-blue-500" />,
    Instagram: <InstagramIcon className="w-8 h-8 text-pink-500" />,
    TikTok: <TikTokIcon className="w-8 h-8 text-gray-200" />,
    WhatsApp: <WhatsAppIcon className="w-8 h-8 text-green-500" />,
};

const InputField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string }> = ({ label, value, onChange, type = 'text' }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
        />
    </div>
);

const ConnectionCard: React.FC<{ connection: PlatformConnection; onSave: (conn: PlatformConnection) => void }> = ({ connection, onSave }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [details, setDetails] = useState(connection);

    const handleSave = () => {
        onSave({ ...details, connected: true });
        setIsExpanded(false);
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow">
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {platformIcons[connection.platform]}
                    <div>
                        <h3 className="text-lg font-bold text-white">{connection.platform}</h3>
                        <div className={`flex items-center gap-1.5 mt-1 ${details.connected ? 'text-green-400' : 'text-gray-400'}`}>
                            <span className={`w-2 h-2 rounded-full ${details.connected ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                            <p className="text-sm font-medium">{details.connected ? 'Connected' : 'Not Connected'}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-4 py-2 font-semibold rounded-md transition text-sm bg-gray-600 text-gray-200 hover:bg-gray-500"
                >
                    {isExpanded ? 'Cancel' : 'Manage'}
                </button>
            </div>
            {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-700 pt-4 space-y-4">
                    <InputField label="App ID" value={details.appId || ''} onChange={e => setDetails({ ...details, appId: e.target.value })} />
                    <InputField label="App Secret" type="password" value={details.appSecret || ''} onChange={e => setDetails({ ...details, appSecret: e.target.value })} />
                    <InputField label="Page ID" value={details.pageId || ''} onChange={e => setDetails({ ...details, pageId: e.target.value })} />
                    <InputField label="Access Token" type="password" value={details.accessToken || ''} onChange={e => setDetails({ ...details, accessToken: e.target.value })} />
                    <button onClick={handleSave} className="w-full px-4 py-2 font-semibold rounded-md transition text-sm bg-yellow-500 text-gray-900 hover:bg-yellow-600">
                        Save & Connect
                    </button>
                </div>
            )}
        </div>
    );
};

const SettingsView: React.FC = () => {
    const [connections, setConnections] = useState<PlatformConnection[]>([]);
    const [aiConfig, setAiConfig] = useState<AiConfig>({ apiKey: '' });
    const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({ callbackUrl: '', verifyToken: '' });
    const [calendarConfig, setCalendarConfig] = useState<GoogleCalendarConfig>({ connected: false });
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [conns, aiConf, webhookConf] = await Promise.all([
                fetchPlatformConnections(),
                fetchAiConfig(),
                fetchWebhookConfig(),
            ]);
            setConnections(conns);
            setAiConfig(aiConf);
            setWebhookConfig(webhookConf);
            // In a real app, you'd fetch this from the backend as well
            setCalendarConfig({ connected: false, userEmail: undefined });
        } catch (error) {
            console.error("Failed to load settings", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSaveConnection = async (connection: PlatformConnection) => {
        try {
            await savePlatformConnection(connection);
            setConnections(prev => prev.map(c => c.platform === connection.platform ? connection : c));
        } catch (error) {
            console.error(`Failed to save ${connection.platform} connection`, error);
        }
    };

    const handleSaveAiConfig = async () => {
        try {
            await saveAiConfig(aiConfig);
            alert("AI Configuration saved!");
        } catch (error) {
            console.error("Failed to save AI config", error);
        }
    };
    
     const handleSaveWebhookConfig = async () => {
        try {
            await saveWebhookConfig({ verifyToken: webhookConfig.verifyToken });
             alert("Webhook Configuration saved!");
        } catch (error) {
            console.error("Failed to save webhook config", error);
        }
    };
    
    const handleConnectGoogle = () => {
        // Placeholder for OAuth flow
        alert("Starting Google Calendar connection process...");
        setCalendarConfig({ connected: true, userEmail: "salon.owner@gmail.com" });
    };

    if (isLoading) {
        return <div className="flex-1 p-8 text-center text-gray-400">Loading settings...</div>;
    }

    return (
        <div className="flex-1 p-8 bg-gray-900 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white">Settings & Integrations</h1>
            <p className="mt-1 text-gray-400">Manage your connections, AI, and webhook configurations.</p>

            <div className="mt-8 max-w-2xl mx-auto space-y-8">
                {/* Social Connections */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-2"><LinkIcon className="w-6 h-6" /> Social Connections</h2>
                    <div className="grid grid-cols-1 gap-6">
                        {connections.map(conn => <ConnectionCard key={conn.platform} connection={conn} onSave={handleSaveConnection} />)}
                    </div>
                </div>

                 {/* Calendar Integration */}
                 <div className="bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-2"><CalendarIcon className="w-6 h-6" /> Calendar Integration</h2>
                    {calendarConfig.connected ? (
                        <div className="text-center">
                            <p className="text-green-400 font-semibold">Connected to Google Calendar</p>
                            <p className="text-gray-300">as {calendarConfig.userEmail}</p>
                            <button className="mt-4 text-sm text-red-400 hover:underline">Disconnect</button>
                        </div>
                    ) : (
                        <button onClick={handleConnectGoogle} className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-md transition text-sm bg-white text-gray-800 hover:bg-gray-200">
                           <GoogleIcon className="w-5 h-5" /> Connect with Google
                        </button>
                    )}
                </div>


                {/* AI Configuration */}
                <div className="bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-2"><CogIcon className="w-6 h-6" /> AI Configuration</h2>
                    <InputField label="Google Gemini API Key" type="password" value={aiConfig.apiKey} onChange={e => setAiConfig({ apiKey: e.target.value })} />
                    <button onClick={handleSaveAiConfig} className="mt-4 px-4 py-2 font-semibold rounded-md transition text-sm bg-yellow-500 text-gray-900 hover:bg-yellow-600">Save AI Key</button>
                </div>
                
                 {/* Webhook Configuration */}
                <div className="bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-300 mb-4">Webhook Configuration</h2>
                    <p className="text-sm text-gray-400 mb-4">Use this information to set up your webhook in the Meta Developer Portal.</p>
                     <div>
                        <label className="block text-sm font-medium text-gray-400">Callback URL</label>
                        <input type="text" readOnly value={webhookConfig.callbackUrl} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm" />
                    </div>
                    <div className="mt-4">
                        <InputField label="Verify Token" value={webhookConfig.verifyToken} onChange={e => setWebhookConfig({ ...webhookConfig, verifyToken: e.target.value })} />
                    </div>
                    <button onClick={handleSaveWebhookConfig} className="mt-4 px-4 py-2 font-semibold rounded-md transition text-sm bg-yellow-500 text-gray-900 hover:bg-yellow-600">Save Token</button>
                </div>

            </div>
        </div>
    );
};

export default SettingsView;
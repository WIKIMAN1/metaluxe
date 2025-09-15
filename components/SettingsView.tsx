import React, { useState, useEffect, useCallback } from 'react';
import { ConnectablePlatform, PlatformConnection, AiConfig, WebhookConfig, GoogleCalendarConfig } from '../types';
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon, LinkIcon, CogIcon, GoogleIcon, CalendarIcon } from './Icons';
import { fetchPlatformConnections, savePlatformConnection, fetchAiConfig, saveAiConfig } from '../services/api';

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

const CopyableInputField: React.FC<{
    label: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    isReadOnly?: boolean;
}> = ({ label, value, onChange, type = 'text', isReadOnly = false }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-400">{label}</label>
            <div className="mt-1 relative rounded-md shadow-sm">
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    readOnly={isReadOnly}
                    className="block w-full pr-10 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded-md placeholder-gray-500 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                    aria-label={label}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button type="button" onClick={handleCopy} className="text-gray-400 hover:text-yellow-400 focus:outline-none" aria-label={`Copy ${label}`}>
                        {copied ? (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

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
    // Webhook config is now static to guarantee it's always available.
    const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({ 
        callbackUrl: 'https://metaluxe-backend.onrender.com/api/webhook', 
        verifyToken: 'METALUXE_WEBHOOK_SECRET_TOKEN_WIKILIS_2025' 
    });
    const [calendarConfig, setCalendarConfig] = useState<GoogleCalendarConfig>({ connected: false });
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [conns, aiConf] = await Promise.all([
                fetchPlatformConnections(),
                fetchAiConfig(),
            ]);
            setConnections(conns);
            setAiConfig(aiConf);
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
                <div className="bg-gray-800 rounded-lg shadow p-6 border border-yellow-500/30">
                    <h2 className="text-xl font-semibold text-gray-200 mb-2 flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        Conexión de Webhook con Meta
                    </h2>
                    <p className="text-sm text-gray-400 mb-6">Sigue estos pasos para permitir que MetaLuxe reciba mensajes de Facebook e Instagram en tiempo real.</p>
                    
                    <div className="space-y-6 text-sm">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-yellow-500 text-black font-bold">1</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-200">Ve al Portal de Desarrolladores de Meta</h3>
                                <p className="text-gray-400">Abre tu aplicación en <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">developers.facebook.com</a> y navega a la sección "Webhook" en el menú de la izquierda.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-yellow-500 text-black font-bold">2</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-200">Configura la Suscripción</h3>
                                <p className="text-gray-400 mb-3">Busca "Messenger" en la lista y haz clic en "Editar suscripción". Copia y pega la siguiente URL en el campo "URL de devolución de llamada".</p>
                                <CopyableInputField label="URL de Devolución de Llamada (Callback URL)" value={webhookConfig.callbackUrl} isReadOnly />
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-yellow-500 text-black font-bold">3</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-200">Verifica tu Servidor</h3>
                                <p className="text-gray-400 mb-3">Ahora, copia y pega este token en el campo "Token de verificación" en el portal de Meta.</p>
                                <CopyableInputField label="Token de Verificación (Verify Token)" value={webhookConfig.verifyToken} isReadOnly />
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-yellow-500 text-black font-bold">4</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-200">Verificar y Guardar</h3>
                                <p className="text-gray-400">Haz clic en "Verificar y Guardar". Si todo es correcto, Meta confirmará la conexión. ¡Luego, suscríbete a los eventos que necesites (como `messages` y `messaging_postbacks`)!</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-700">
                        <h4 className="font-semibold text-yellow-300">Nota Importante</h4>
                        <p className="text-xs text-gray-400 mt-1">
                            Si la verificación falla, asegúrate de que has copiado los valores exactamente como aparecen y que el servidor backend de MetaLuxe está en línea y accesible públicamente.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SettingsView;
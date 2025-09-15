import React, { useState, useEffect } from 'react';
import { SocialPlatform, AutomationRule, Service } from '../types';
import { FacebookIcon, TikTokIcon, InstagramIcon } from './Icons';
import { fetchAutomationRules, fetchServices } from '../services/api';

const platformIcons: Record<SocialPlatform, React.ReactNode> = {
    [SocialPlatform.Facebook]: <FacebookIcon className="w-5 h-5 text-blue-500" />,
    [SocialPlatform.Instagram]: <InstagramIcon className="w-5 h-5 text-pink-500" />,
    [SocialPlatform.TikTok]: <TikTokIcon className="w-5 h-5 text-gray-200" />,
};

const Card: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-gray-400">{description}</p>
        <div className="mt-6">{children}</div>
    </div>
);

const AutomationView: React.FC = () => {
    const [welcomeMessage, setWelcomeMessage] = useState('¡Hola! 👋 Bienvenida a nuestro salón. ¿Cómo podemos ayudarte hoy?');
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [rulesData, servicesData] = await Promise.all([
                    fetchAutomationRules(),
                    fetchServices(),
                ]);
                setRules(rulesData);
                setServices(servicesData);
            } catch (error) {
                console.error("Failed to load automation data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    if (isLoading) {
        return <div className="flex-1 p-8 flex justify-center items-center text-gray-400"><p>Loading Automation Rules...</p></div>;
    }

    return (
        <div className="flex-1 p-8 bg-gray-900 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white">Automation Engine</h1>
            <p className="mt-1 text-gray-400">Configure your 24/7 AI-powered sales agent.</p>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:col-span-2">
                    <Card title="Welcome Message" description="This message is sent automatically when a user starts a new private conversation.">
                        <textarea
                            value={welcomeMessage}
                            onChange={(e) => setWelcomeMessage(e.target.value)}
                            rows={3}
                            className="w-full p-2 border bg-gray-700 border-gray-600 text-gray-200 rounded-md focus:border-yellow-500 focus:ring-yellow-500 focus:ring-opacity-40 focus:outline-none"
                        />
                        <button className="mt-4 px-4 py-2 bg-yellow-500 text-gray-900 font-semibold rounded-md hover:bg-yellow-600 transition">Save Welcome Message</button>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card title="Automated Comment Replies" description="Automatically reply to comments and let the AI start private conversations.">
                        <div className="p-4 mb-4 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-md">
                            <h4 className="font-semibold text-blue-300">TikTok Automation Viability</h4>
                            <p className="text-sm text-blue-300 mt-1">
                                The TikTok API allows for monitoring and public replies to comments. However, automatically sending direct messages (DMs) is not currently supported. The AI will be instructed to guide users to the link in your bio.
                            </p>
                        </div>
                        <div className="space-y-4">
                            {rules.map(rule => (
                                <div key={rule.id} className="p-4 border border-gray-700 rounded-md bg-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {platformIcons[rule.platform]}
                                            <span className="font-bold text-gray-200">{rule.platform} Rule</span>
                                        </div>
                                        <button className="text-sm text-yellow-400 hover:underline">Edit</button>
                                    </div>
                                    <div className="mt-3 text-sm space-y-2">
                                        <p><span className="font-semibold text-gray-400">Keywords:</span> {rule.keywords.map(k => <span key={k} className="ml-1 px-2 py-0.5 bg-gray-600 text-gray-200 rounded-full text-xs">{k}</span>)}</p>
                                        <p><span className="font-semibold text-gray-400">Public Reply:</span><span className="text-gray-300"> "{rule.publicReply}"</span></p>
                                        <div>
                                          <label className="font-semibold text-gray-400">Bot Instructions (System Prompt):</label>
                                          <p className="mt-1 p-2 bg-gray-800 border border-gray-600 rounded-md text-gray-300">{rule.systemPrompt}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-4 px-4 py-2 border border-yellow-400 text-yellow-400 font-semibold rounded-md hover:bg-yellow-400 hover:text-black transition">Add New Rule</button>
                    </Card>
                </div>

                 <div className="lg:col-span-2">
                    <Card title="Services & Prices Panel" description="Manage the list of services and prices your bot can provide to customers.">
                         <div className="space-y-4">
                            {services.map(service => (
                                <div key={service.id} className="p-4 border border-gray-700 rounded-md bg-gray-700 flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-200">{service.name} - <span className="text-yellow-400">{service.price}</span></p>
                                        <p className="text-sm text-gray-400">{service.description}</p>
                                    </div>
                                     <button className="text-sm text-yellow-400 hover:underline">Edit</button>
                                </div>
                            ))}
                        </div>
                        <button className="mt-4 px-4 py-2 border border-yellow-400 text-yellow-400 font-semibold rounded-md hover:bg-yellow-400 hover:text-black transition">Add New Service</button>
                    </Card>
                </div>

            </div>
        </div>
    );
};

export default AutomationView;
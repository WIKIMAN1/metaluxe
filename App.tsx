
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import InboxView from './components/InboxView';
import CustomersView from './components/CustomersView';
import AutomationView from './components/AutomationView';
import GoogleCalendarView from './components/GoogleCalendarView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import { View, Conversation, Customer, Message, MessageType, Service } from './types';
import { fetchConversations, fetchAiConfig, fetchServices, sendMessage } from './services/api';
import { initializeAi, getBotResponseStream, transcribeAudio } from './services/geminiService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('isAuthenticated') === 'true');
  const [activeView, setActiveView] = useState<View>('inbox');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingConversationId, setTypingConversationId] = useState<string | null>(null);
  const [isAiInitialized, setIsAiInitialized] = useState(false);
  
  const reconnectTimeoutRef = useRef<number | null>(null);

  const handleConversationUpdate = useCallback((updatedConversation: Conversation) => {
      setConversations(prev => {
          const exists = prev.some(c => c.id === updatedConversation.id);
          let newConversations;
          if (exists) {
              newConversations = prev.map(c => c.id === updatedConversation.id ? updatedConversation : c);
          } else {
              newConversations = [updatedConversation, ...prev];
          }
          return newConversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });

      if (selectedConversation?.id === updatedConversation.id) {
          setSelectedConversation(updatedConversation);
      }
  }, [selectedConversation]);

  const connectWebSocket = useCallback(() => {
        const wsUrl = `wss://metaluxe-backend.onrender.com`;
        const ws = new WebSocket(wsUrl);
        let reconnectDelay = 5000;

        ws.onopen = () => {
            console.log('WebSocket connection established.');
            reconnectDelay = 5000; // Reset delay on successful connection
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };

        ws.onmessage = (event) => {
            try {
                const updatedConversation = JSON.parse(event.data);
                handleConversationUpdate(updatedConversation);
            } catch (error) {
                console.error("Failed to parse WebSocket message:", error);
            }
        };

        ws.onclose = (event) => {
            console.log(`WebSocket closed. Code=${event.code}, Reason=${event.reason}. Reconnecting in ${reconnectDelay / 1000}s...`);
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = window.setTimeout(connectWebSocket, reconnectDelay);
        };

        ws.onerror = () => {
            console.error('WebSocket error occurred. Closing socket.');
            ws.close();
        };

        return () => {
            ws.close();
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [handleConversationUpdate]);

  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated) {
        setIsLoading(false);
        return;
    }
    try {
      setIsLoading(true);
      setError(null);
      
      const aiConfig = await fetchAiConfig();
      if (aiConfig && aiConfig.apiKey) {
        initializeAi(aiConfig.apiKey);
        setIsAiInitialized(true);
      }

      const [loadedConversations, servicesData] = await Promise.all([
          fetchConversations(),
          fetchServices()
      ]);
      
      setConversations(loadedConversations);
      setServices(servicesData);

      if (loadedConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(loadedConversations[0]);
      }
    } catch (err) {
      setError("Failed to load data from backend. Is the server running?");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedConversation]);


  useEffect(() => {
    loadInitialData();
  }, [isAuthenticated, loadInitialData]);
  
  useEffect(() => {
    if(isAuthenticated){
      const cleanup = connectWebSocket();
      return cleanup;
    }
  }, [isAuthenticated, connectWebSocket]);

  const handleLogin = () => {
    sessionStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setConversations([]);
    setSelectedConversation(null);
  };
  
  const handleBotResponse = useCallback(async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    if (!isAiInitialized) {
        const errorMessage = "AI not configured. Please add your Google Gemini API Key in 'Integrations' to enable automated responses.";
        sendMessage(conversationId, errorMessage).catch(err => console.error("Failed to send AI config error message", err));
        return;
    }

    setTypingConversationId(conversationId);
    try {
        const stream = await getBotResponseStream(conversation.messages, services);
        
        // This message is a temporary placeholder for streaming
        const botMessage: Message = { id: `msg_bot_${Date.now()}`, text: '', sender: 'bot', timestamp: new Date().toISOString(), type: MessageType.PrivateMessage };
        // FIX: handleConversationUpdate expects 1 argument, but was passed 2. Removed the extra conversation.id argument.
        handleConversationUpdate({ ...conversation, messages: [...conversation.messages, botMessage] });
        
        let accumulatedText = "";
        for await (const chunk of stream) {
            accumulatedText += chunk.text;
            const updatedBotMessage = { ...botMessage, text: accumulatedText };
            const updatedConversation = {...conversation, messages: [...conversation.messages.slice(0, -1), updatedBotMessage]};
            // FIX: handleConversationUpdate expects 1 argument, but was passed 2. Removed the extra conversation.id argument.
            handleConversationUpdate(updatedConversation);
        }
        
        // Send the final message to the backend/Meta
        await sendMessage(conversationId, accumulatedText);
        
    } catch (error: any) {
        console.error("Error generating bot response:", error);
        const errorMessageText = error.message.includes("API Key") ? "AI API Key is invalid. Please check it in 'Integrations'." : "Sorry, I'm having trouble connecting. Please try again.";
        sendMessage(conversationId, errorMessageText).catch(err => console.error("Failed to send bot error message", err));
    } finally {
        setTypingConversationId(null);
    }
  }, [conversations, services, isAiInitialized, handleConversationUpdate]);

  // Proactive Bot Response: Trigger bot whenever a new user message arrives
  useEffect(() => {
    conversations.forEach(conv => {
        if(conv.messages.length > 0) {
            const lastMessage = conv.messages[conv.messages.length - 1];
            // Ensure we don't respond to our own messages and are not already typing
            if(lastMessage.sender === 'user' && typingConversationId !== conv.id) {
                // Check if the bot was the second to last message to avoid loops
                const secondLastMessage = conv.messages[conv.messages.length - 2];
                if (!secondLastMessage || secondLastMessage.sender === 'user') {
                     setTimeout(() => handleBotResponse(conv.id), 500);
                }
            }
        }
    });
  }, [conversations, handleBotResponse, typingConversationId]);
  
  const handleSendTextMessage = (conversationId: string, text: string) => {
      // This is a manual message sent by the salon owner
      sendMessage(conversationId, text).catch(err => {
          console.error("Failed to send manual message:", err);
          // Here you could add a local message to the conversation indicating failure
      });
  };

  const handleSendAudio = async (conversationId: string, audioBlob: Blob) => {
    if (!isAiInitialized) {
        const errorMessage = "Audio transcription requires a configured AI. Please add your Google Gemini API Key in 'Integrations'.";
        sendMessage(conversationId, errorMessage);
        return;
    }

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    setTypingConversationId(conversationId);
    try {
        const transcribedText = await transcribeAudio(audioBlob);
        const userMessageText = `🎙️ "${transcribedText}"`;
        // Send the transcription as a message from the salon owner
        await sendMessage(conversationId, userMessageText);
    } catch (error) {
        console.error("Error transcribing audio:", error);
        sendMessage(conversationId, "Sorry, I couldn't understand the audio. Please try again.");
    } finally {
        setTypingConversationId(null);
    }
  };


  const customers = useMemo<Customer[]>(() => {
    const customerMap = new Map<string, Customer>();
    conversations.forEach(c => {
        if (!customerMap.has(c.customer.id)) {
            customerMap.set(c.customer.id, c.customer);
        }
    });
    return Array.from(customerMap.values());
  }, [conversations]);

  const unreadCount = useMemo(() => {
    return conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
  }, [conversations]);

  const renderActiveView = () => {
    if (isLoading) {
      return <div className="flex-1 flex items-center justify-center bg-gray-900"><p className="text-gray-400">Loading your workspace...</p></div>
    }
    if (error) {
       return <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-gray-900">
          <p className="text-red-500 font-semibold text-lg">{error}</p>
          <p className="text-gray-400 mt-2">Please ensure the backend server is running and accessible.</p>
       </div>
    }

    switch (activeView) {
      case 'inbox':
        return <InboxView 
                    conversations={conversations} 
                    selectedConversation={selectedConversation}
                    onSelectConversation={setSelectedConversation}
                    onSendTextMessage={handleSendTextMessage}
                    onSendAudio={handleSendAudio}
                    typingConversationId={typingConversationId}
                />;
      case 'customers':
        return <CustomersView customers={customers} />;
      case 'automation':
        return <AutomationView />;
      case 'calendar':
        return <GoogleCalendarView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <InboxView 
                    conversations={conversations} 
                    selectedConversation={selectedConversation}
                    onSelectConversation={setSelectedConversation}
                    onSendTextMessage={handleSendTextMessage}
                    onSendAudio={handleSendAudio}
                    typingConversationId={typingConversationId}
                />;
    }
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-900 font-sans antialiased text-gray-200">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        unreadCount={unreadCount} 
        onLogout={handleLogout} 
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderActiveView()}
      </main>
    </div>
  );
};

export default App;

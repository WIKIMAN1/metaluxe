
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import InboxView from './components/InboxView';
import CustomersView from './components/CustomersView';
import AutomationView from './components/AutomationView';
import GoogleCalendarView from './components/GoogleCalendarView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import { View, Conversation, Customer, Message, MessageType, Service } from './types';
import { fetchConversations, fetchAiConfig, fetchServices } from './services/api';
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
      } else {
        setIsAiInitialized(false);
      }

      const [loadedConversations, servicesData] = await Promise.all([
          fetchConversations(),
          fetchServices()
      ]);
      
      setConversations(loadedConversations);
      setServices(servicesData);

      if (loadedConversations.length > 0) {
        setSelectedConversation(loadedConversations[0]);
      }
    } catch (err) {
      setError("Failed to load data from backend. Is the server running?");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);


  useEffect(() => {
    loadInitialData();
  }, [isAuthenticated, loadInitialData]);

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
  
  const updateConversationState = useCallback((conversationId: string, message: Message, isNewMessage: boolean) => {
      setConversations(prev => {
          const conversationToUpdate = prev.find(c => c.id === conversationId);
          if (!conversationToUpdate) return prev;
          
          let updatedMessages;
          if (isNewMessage) {
              updatedMessages = [...conversationToUpdate.messages, message];
          } else { // It's an update to the last message (streaming)
              updatedMessages = [...conversationToUpdate.messages];
              updatedMessages[updatedMessages.length - 1] = message;
          }

          const updatedConversation: Conversation = {
              ...conversationToUpdate,
              messages: updatedMessages,
              lastMessagePreview: message.text.substring(0, 40) + '...',
              timestamp: message.timestamp,
          };
          
          if (selectedConversation?.id === updatedConversation.id) {
              setSelectedConversation(updatedConversation);
          }

          return prev
              .map(c => c.id === updatedConversation.id ? updatedConversation : c)
              .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
  }, [selectedConversation]);
  
  
  const handleBotResponse = useCallback(async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    if (!isAiInitialized) {
        const errorMessage: Message = {
            id: `msg_err_ai_init_${Date.now()}`,
            text: "AI not configured. Please add your Google Gemini API Key in the 'Integrations' settings to enable automated responses.",
            sender: 'bot',
            timestamp: new Date().toISOString(),
            type: MessageType.PrivateMessage
        };
        updateConversationState(conversationId, errorMessage, true);
        return;
    }

    setTypingConversationId(conversationId);
    try {
        const stream = await getBotResponseStream(conversation.messages, services);
        
        const botMessage: Message = {
            id: `msg_bot_${Date.now()}`,
            text: '',
            sender: 'bot',
            timestamp: new Date().toISOString(),
            type: MessageType.PrivateMessage
        };
        updateConversationState(conversationId, botMessage, true);
        
        let accumulatedText = "";
        for await (const chunk of stream) {
            accumulatedText += chunk.text;
            const updatedBotMessage = { ...botMessage, text: accumulatedText };
            updateConversationState(conversationId, updatedBotMessage, false);
        }
    } catch (error: any) {
        console.error("Error generating bot response:", error);
        const errorMessageText = error.message.includes("API Key") ? "AI API Key is invalid. Please check it in the 'Integrations' settings." : "Sorry, I'm having trouble connecting. Please try again later.";
        const errorMessage: Message = {
            id: `msg_err_${Date.now()}`,
            text: errorMessageText,
            sender: 'bot',
            timestamp: new Date().toISOString(),
            type: MessageType.PrivateMessage
        };
        updateConversationState(conversationId, errorMessage, true);
    } finally {
        setTypingConversationId(null);
    }
  }, [conversations, services, updateConversationState, isAiInitialized]);

  // Proactive Bot Response: Trigger bot whenever a user message is added
  useEffect(() => {
    conversations.forEach(conv => {
        if(conv.messages.length > 0) {
            const lastMessage = conv.messages[conv.messages.length - 1];
            if(lastMessage.sender === 'user' && typingConversationId !== conv.id) {
                setTimeout(() => handleBotResponse(conv.id), 500);
            }
        }
    });
  }, [conversations, handleBotResponse, typingConversationId]);
  
  const handleSendTextMessage = (conversationId: string, text: string) => {
      const userMessage: Message = {
            id: `msg_user_${Date.now()}`,
            text: text,
            sender: 'user',
            timestamp: new Date().toISOString(),
            type: MessageType.PrivateMessage
        };
      updateConversationState(conversationId, userMessage, true);
  };

  const handleSendAudio = async (conversationId: string, audioBlob: Blob) => {
      if (!isAiInitialized) {
        const errorMessage: Message = {
            id: `msg_err_ai_init_audio_${Date.now()}`,
            text: "Audio transcription requires a configured AI. Please add your Google Gemini API Key in the 'Integrations' settings.",
            sender: 'bot',
            timestamp: new Date().toISOString(),
            type: MessageType.PrivateMessage
        };
        updateConversationState(conversationId, errorMessage, true);
        return;
    }

      setTypingConversationId(conversationId); // Show a general "processing" state
      try {
          const transcribedText = await transcribeAudio(audioBlob);
          const userMessage: Message = {
              id: `msg_audio_${Date.now()}`,
              text: `🎙️ "${transcribedText}"`,
              sender: 'user',
              timestamp: new Date().toISOString(),
              type: MessageType.PrivateMessage
          };
          updateConversationState(conversationId, userMessage, true);
      } catch (error) {
          console.error("Error transcribing audio:", error);
          const errorMessage: Message = {
              id: `msg_err_transcribe_${Date.now()}`,
              text: "Sorry, I couldn't understand the audio. Please try again.",
              sender: 'bot',
              timestamp: new Date().toISOString(),
              type: MessageType.PrivateMessage
          };
          updateConversationState(conversationId, errorMessage, true);
      } finally {
          setTypingConversationId(null);
      }
  };


  const customers = useMemo<Customer[]>(() => {
    return conversations.map(c => c.customer);
  }, [conversations]);

  const unreadCount = useMemo(() => {
    return conversations.reduce((acc, curr) => acc + curr.unreadCount, 0);
  }, [conversations]);

  const renderActiveView = () => {
    if (isLoading) {
      return <div className="flex-1 flex items-center justify-center bg-gray-900"><p className="text-gray-400">Loading your workspace...</p></div>
    }
    if (error) {
       return <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-gray-900">
          <p className="text-red-500 font-semibold text-lg">{error}</p>
          <p className="text-gray-400 mt-2">Please ensure the backend server is running. Navigate to the `backend` directory and run `npm install` then `npm start`.</p>
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

import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message, MessageType, SocialPlatform, Service } from '../types';
import { FacebookIcon, InstagramIcon, TikTokIcon, PaperAirplaneIcon, TagIcon, InboxIcon, MicrophoneIcon } from './Icons';
import { format, parseISO } from 'date-fns';

// Platform Icon Mapping
const platformIcons: Record<SocialPlatform, React.ReactNode> = {
  [SocialPlatform.Facebook]: <FacebookIcon className="w-5 h-5 text-blue-600" />,
  [SocialPlatform.Instagram]: <InstagramIcon className="w-5 h-5 text-pink-500" />,
  [SocialPlatform.TikTok]: <TikTokIcon className="w-5 h-5 text-black" />,
};

// --- Child Components ---

interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (conversation: Conversation) => void;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({ conversation, isSelected, onSelect }) => {
  return (
    <button onClick={() => onSelect(conversation)} className={`flex items-start w-full px-4 py-3 text-left transition-colors duration-200 focus:outline-none ${isSelected ? 'bg-yellow-500 bg-opacity-20' : 'hover:bg-gray-800'}`}>
      <img className="object-cover w-12 h-12 rounded-full" src={conversation.customer.avatarUrl} alt="avatar" />
      <div className="w-full ml-3 overflow-hidden">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-200 truncate">{conversation.customer.realName}</h3>
            <span className="text-xs text-gray-400">{format(parseISO(conversation.timestamp), 'p')}</span>
        </div>
        <p className="text-sm text-gray-400 mt-1 truncate">{conversation.lastMessagePreview}</p>
        <div className="flex items-center justify-between mt-2">
            {platformIcons[conversation.customer.platform]}
            {conversation.unreadCount > 0 && <span className="px-2 py-1 text-xs text-black bg-yellow-400 rounded-full font-bold">{conversation.unreadCount}</span>}
        </div>
      </div>
    </button>
  );
};

interface ChatWindowProps {
    conversation: Conversation | null;
    onSendTextMessage: (conversationId: string, text: string) => void;
    onSendAudio: (conversationId: string, audioBlob: Blob) => void;
    typingConversationId: string | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onSendTextMessage, onSendAudio, typingConversationId }) => {
    const [inputValue, setInputValue] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isBotTyping = conversation?.id === typingConversationId;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation?.messages, isBotTyping]);


    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !conversation) return;
        onSendTextMessage(conversation.id, inputValue);
        setInputValue('');
    };
    
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (conversation) {
                    onSendAudio(conversation.id, audioBlob);
                }
                audioChunksRef.current = [];
                 // Stop all tracks to release the microphone
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please check your browser permissions.");
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };
    
    const handleMicPress = () => {
        if (!isRecording) {
            startRecording();
        }
    };

    const handleMicRelease = () => {
        if (isRecording) {
            stopRecording();
        }
    };


    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-900">
                <div className="text-center text-gray-500">
                    <InboxIcon className="w-16 h-16 mx-auto" />
                    <h3 className="mt-2 text-lg font-medium text-gray-300">Select a conversation</h3>
                    <p className="mt-1 text-sm">Choose a conversation from the left panel to see the messages.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-900">
            <div className="px-6 py-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">{conversation.customer.realName}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        {platformIcons[conversation.customer.platform]}
                        <span>on {conversation.customer.platform}</span>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {conversation.messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'bot' ? '' : 'flex-row-reverse'}`}>
                        {msg.sender === 'bot' && <img className="w-8 h-8 rounded-full" src="https://picsum.photos/seed/salon/100/100" alt="bot avatar" />}
                        <div className={`px-4 py-2 rounded-lg max-w-lg ${msg.sender === 'bot' ? 'bg-gray-700 text-gray-200' : 'bg-yellow-500 text-gray-900'}`}>
                           {msg.text.startsWith('🎙️') ? (
                                <p><em>{msg.text}</em></p>
                            ) : (
                                <p>{msg.text}</p>
                            )}
                             {msg.type === MessageType.Comment && (
                                <p className="text-xs mt-2 opacity-70 border-t border-current border-opacity-50 pt-1">Original Comment</p>
                            )}
                        </div>
                    </div>
                ))}
                 {isBotTyping && (
                    <div className="flex items-end gap-2">
                        <img className="w-8 h-8 rounded-full" src="https://picsum.photos/seed/salon/100/100" alt="bot avatar" />
                        <div className="px-4 py-3 rounded-lg bg-gray-700">
                            <div className="flex items-center justify-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-yellow-300 animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-300 animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-300 animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Type your message..." 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full py-3 pl-4 pr-12 text-gray-200 bg-gray-700 border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                    <button type="submit" className="flex items-center justify-center w-12 h-12 text-gray-900 bg-yellow-400 rounded-full hover:bg-yellow-500 transition disabled:bg-gray-600" disabled={isBotTyping}>
                        <PaperAirplaneIcon className="w-6 h-6" />
                    </button>
                    <button 
                        type="button"
                        onMouseDown={handleMicPress}
                        onMouseUp={handleMicRelease}
                        onTouchStart={handleMicPress}
                        onTouchEnd={handleMicRelease}
                        className={`flex items-center justify-center w-12 h-12 rounded-full transition ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}
                    >
                        <MicrophoneIcon className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

interface CustomerProfileProps {
    customer: Conversation['customer'] | null;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customer }) => {
    if (!customer) {
        return <div className="w-96 bg-gray-800 border-l border-gray-700"></div>;
    }
    
    return (
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-6 border-b border-gray-700 text-center">
                <img className="w-24 h-24 rounded-full mx-auto" src={customer.avatarUrl} alt="customer avatar" />
                <h3 className="mt-4 text-xl font-bold text-white">{customer.realName}</h3>
                <p className="text-sm text-gray-400">@{customer.username}</p>
            </div>
            <div className="flex-1 p-6 space-y-6 overflow-y-auto text-gray-300">
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase">Contact Info</h4>
                    <div className="mt-2 space-y-2">
                        <p><span className="font-medium text-gray-400">Email:</span> {customer.email || 'Not provided'}</p>
                        <p><span className="font-medium text-gray-400">Phone:</span> {customer.phone || 'Not provided'}</p>
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase">Tags</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {customer.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-300 rounded-full">
                                <TagIcon className="w-3 h-3"/> {tag}
                            </span>
                        ))}
                    </div>
                </div>
                 <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase">Notes</h4>
                    <p className="mt-2 text-sm text-gray-300 bg-gray-700 p-3 rounded-md border border-gray-600">{customer.notes}</p>
                </div>
            </div>
            <div className="p-6 border-t border-gray-700">
                <button className="w-full py-2 px-4 bg-yellow-400 text-gray-900 font-semibold rounded-md hover:bg-yellow-500 transition">Edit Profile</button>
            </div>
        </div>
    );
};


// --- Main Inbox View Component ---

interface InboxViewProps {
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    onSelectConversation: (conversation: Conversation) => void;
    onSendTextMessage: (conversationId: string, text: string) => void;
    onSendAudio: (conversationId: string, audioBlob: Blob) => void;
    typingConversationId: string | null;
}

const InboxView: React.FC<InboxViewProps> = (props) => {
    const { conversations, selectedConversation, onSelectConversation, onSendTextMessage, onSendAudio, typingConversationId } = props;

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
              {conversations.map(conv => (
                  <ConversationListItem
                      key={conv.id}
                      conversation={conv}
                      isSelected={selectedConversation?.id === conv.id}
                      onSelect={onSelectConversation}
                  />
              ))}
          </div>
      </div>
      <ChatWindow 
        conversation={selectedConversation}
        onSendTextMessage={onSendTextMessage}
        onSendAudio={onSendAudio}
        typingConversationId={typingConversationId}
       />
      <CustomerProfile customer={selectedConversation?.customer || null} />
    </div>
  );
};

export default InboxView;

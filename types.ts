export enum SocialPlatform {
  Facebook = 'Facebook',
  Instagram = 'Instagram',
  TikTok = 'TikTok',
}

export type ConnectablePlatform = SocialPlatform | 'WhatsApp';

export interface PlatformConnection {
    platform: ConnectablePlatform;
    connected: boolean;
    appId?: string;
    appSecret?: string;
    pageId?: string;
    accessToken?: string;
}

export interface WebhookConfig {
    verifyToken: string;
    callbackUrl: string;
}

export interface AiConfig {
    apiKey: string;
}

export interface GoogleCalendarConfig {
    connected: boolean;
    userEmail?: string;
}

export enum MessageType {
  PrivateMessage = 'Private Message',
  Comment = 'Comment',
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: 'user' | 'bot';
  type: MessageType;
}

export interface Customer {
  id: string;
  username: string;
  realName: string;
  platform: SocialPlatform;
  avatarUrl: string;
  phone: string;
  email: string;
  notes: string;
  tags: string[];
}

export interface Conversation {
  id:string;
  customer: Customer;
  messages: Message[];
  lastMessagePreview: string;
  unreadCount: number;
  timestamp: string;
}

export interface AutomationRule {
  id: string;
  platform: SocialPlatform;
  trigger: 'comment';
  keywords: string[];
  publicReply: string;
  systemPrompt: string;
}

export interface Service {
  id: string;
  name: string;
  price: string;
  description: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    customerName?: string;
    service?: string;
}

export type View = 'inbox' | 'customers' | 'automation' | 'calendar' | 'settings';
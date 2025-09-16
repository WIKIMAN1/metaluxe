const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'db.json');

const { initialRules, initialServices } = require('./mock.js');

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- Helper Functions ---
const readDb = () => {
    const RENDER_URL = 'https://metaluxe-backend.onrender.com';
    const CALLBACK_URL = `${RENDER_URL}/api/webhook`;
    if (!fs.existsSync(DB_PATH)) {
        const defaultStructure = {
            connections: [
                { platform: 'Facebook', connected: false, appId: '', appSecret: '', pageId: '', accessToken: '' },
                { platform: 'Instagram', connected: false, appId: '', appSecret: '', pageId: '', accessToken: '' },
                { platform: 'TikTok', connected: false, appId: '', appSecret: '', pageId: '', accessToken: '' },
                { platform: 'WhatsApp', connected: false, appId: '', appSecret: '', pageId: '', accessToken: '' },
            ],
            aiConfig: { apiKey: '' },
            webhookConfig: { verifyToken: `metaluxe-secret-token-${Date.now()}`, callbackUrl: CALLBACK_URL },
            conversations: [],
            automationRules: initialRules,
            services: initialServices,
            automationConfig: { welcomeMessage: '¡Hola! 👋 Bienvenida a nuestro salón. ¿Cómo podemos ayudarte hoy?' },
            googleCalendarConfig: { connected: false, userEmail: '' },
            calendarEvents: [
                 { id: '1', title: 'Botox - Ana Garcia', start: new Date().toISOString(), end: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(), customerName: 'Ana Garcia', service: 'Botox Application' },
            ]
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(defaultStructure, null, 2));
        return defaultStructure;
    }
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        const parsedData = JSON.parse(data);
        // Ensure all keys exist
        if (!parsedData.webhookConfig) parsedData.webhookConfig = { verifyToken: `metaluxe-secret-token-${Date.now()}`, callbackUrl: CALLBACK_URL };
        else parsedData.webhookConfig.callbackUrl = CALLBACK_URL;
        if (!parsedData.automationRules) parsedData.automationRules = initialRules;
        if (!parsedData.services) parsedData.services = initialServices;
        if (!parsedData.automationConfig) parsedData.automationConfig = { welcomeMessage: '¡Hola! 👋 Bienvenida a nuestro salón. ¿Cómo podemos ayudarte hoy?' };
        if (!parsedData.googleCalendarConfig) parsedData.googleCalendarConfig = { connected: false, userEmail: '' };
        if (!parsedData.calendarEvents) parsedData.calendarEvents = [];
        
        return parsedData;
    } catch (error) {
        console.error("Error reading db.json, creating a new one:", error);
        fs.unlinkSync(DB_PATH);
        return readDb();
    }
};

const writeDb = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// --- HTTP Server and WebSocket Server Setup ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('close', () => console.log('Client disconnected'));
});

// Heartbeat to keep connections alive
setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping(() => {});
    });
}, 30000);

const broadcast = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};


// --- API Endpoints ---

// AUTOMATION
app.get('/api/automation-rules', (req, res) => res.json(readDb().automationRules || []));
app.post('/api/automation-rules', (req, res) => {
    const db = readDb();
    const newRule = { ...req.body, id: `rule_${Date.now()}` };
    db.automationRules.push(newRule);
    writeDb(db);
    res.status(201).json(newRule);
});
app.put('/api/automation-rules/:id', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    const updatedRule = req.body;
    const index = db.automationRules.findIndex(r => r.id === id);
    if (index !== -1) {
        db.automationRules[index] = updatedRule;
        writeDb(db);
        res.json(updatedRule);
    } else {
        res.status(404).json({ message: 'Rule not found' });
    }
});
app.delete('/api/automation-rules/:id', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    db.automationRules = db.automationRules.filter(r => r.id !== id);
    writeDb(db);
    res.status(204).send();
});

app.get('/api/services', (req, res) => res.json(readDb().services || []));
app.post('/api/services', (req, res) => {
    const db = readDb();
    const newService = { ...req.body, id: `serv_${Date.now()}` };
    db.services.push(newService);
    writeDb(db);
    res.status(201).json(newService);
});
app.put('/api/services/:id', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    const updatedService = req.body;
    const index = db.services.findIndex(s => s.id === id);
    if (index !== -1) {
        db.services[index] = updatedService;
        writeDb(db);
        res.json(updatedService);
    } else {
        res.status(404).json({ message: 'Service not found' });
    }
});
app.delete('/api/services/:id', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    db.services = db.services.filter(s => s.id !== id);
    writeDb(db);
    res.status(204).send();
});

app.get('/api/automation-config', (req, res) => res.json(readDb().automationConfig));
app.post('/api/automation-config', (req, res) => {
    const { welcomeMessage } = req.body;
    const db = readDb();
    db.automationConfig.welcomeMessage = welcomeMessage;
    writeDb(db);
    res.json({ message: 'Welcome message updated' });
});


// CONVERSATIONS & GENERAL
app.get('/api/conversations', (req, res) => res.json(readDb().conversations || []));
app.get('/api/connections', (req, res) => res.json(readDb().connections));

app.post('/api/connections', (req, res) => {
    const updatedConnection = req.body;
    const db = readDb();
    db.connections = db.connections.map(c => c.platform === updatedConnection.platform ? { ...c, ...updatedConnection } : c);
    writeDb(db);
    res.status(200).json({ message: 'Connection updated successfully' });
});

app.get('/api/ai-config', (req, res) => res.json(readDb().aiConfig));
app.post('/api/ai-config', (req, res) => {
    const { apiKey } = req.body;
    const db = readDb();
    db.aiConfig = { apiKey };
    writeDb(db);
    res.status(200).json({ message: 'AI configuration saved.' });
});

app.get('/api/webhook-config', (req, res) => res.json(readDb().webhookConfig));
app.post('/api/webhook-config', (req, res) => {
    const { verifyToken } = req.body;
    const db = readDb();
    db.webhookConfig = { ...db.webhookConfig, verifyToken };
    writeDb(db);
    res.status(200).json({ message: 'Webhook token updated.' });
});

// --- Google Calendar Endpoints ---
app.get('/api/google-calendar/config', (req, res) => res.json(readDb().googleCalendarConfig));
app.post('/api/google-calendar/connect', (req, res) => {
    const db = readDb();
    db.googleCalendarConfig = { connected: true, userEmail: 'salon.owner@gmail.com' };
    writeDb(db);
    res.json(db.googleCalendarConfig);
});
app.post('/api/google-calendar/disconnect', (req, res) => {
    const db = readDb();
    db.googleCalendarConfig = { connected: false, userEmail: '' };
    writeDb(db);
    res.json(db.googleCalendarConfig);
});
app.get('/api/calendar-events', (req, res) => {
    const db = readDb();
    res.json(db.calendarEvents || []);
});
app.post('/api/calendar-events', (req, res) => {
    const db = readDb();
    const newEvent = { ...req.body, id: `evt_${Date.now()}` };
    db.calendarEvents.push(newEvent);
    writeDb(db);
    res.status(201).json(newEvent);
});
app.put('/api/calendar-events/:id', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    const index = db.calendarEvents.findIndex(evt => evt.id === id);
    if (index !== -1) {
        db.calendarEvents[index] = { ...db.calendarEvents[index], ...req.body };
        writeDb(db);
        res.json(db.calendarEvents[index]);
    } else {
        res.status(404).json({ message: 'Event not found' });
    }
});
app.delete('/api/calendar-events/:id', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    db.calendarEvents = db.calendarEvents.filter(evt => evt.id !== id);
    writeDb(db);
    res.status(204).send();
});

// Endpoint to send a message
app.post('/api/conversations/:conversationId/messages', async (req, res) => {
    const { conversationId } = req.params;
    const { text } = req.body;
    const db = readDb();

    const conversation = db.conversations.find(c => c.id === conversationId);
    if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
    }

    const connection = db.connections.find(c => c.platform === conversation.customer.platform);
    if (!connection || !connection.accessToken) {
        return res.status(400).json({ error: 'Platform not connected or access token is missing.' });
    }

    const recipientId = conversation.customer.id;
    const platform = conversation.customer.platform;
    const accessToken = connection.accessToken;

    try {
        const metaResponse = await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${accessToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text },
                messaging_type: 'RESPONSE'
            })
        });

        const metaResponseData = await metaResponse.json();
        if (!metaResponse.ok) {
            throw new Error(`Meta API Error: ${JSON.stringify(metaResponseData)}`);
        }

        const botMessage = {
            id: `msg_bot_${Date.now()}`,
            text: text,
            sender: 'bot',
            timestamp: new Date().toISOString(),
            type: 'Private Message'
        };

        conversation.messages.push(botMessage);
        conversation.lastMessagePreview = text.substring(0, 40) + '...';
        conversation.timestamp = botMessage.timestamp;
        
        db.conversations = db.conversations.map(c => c.id === conversationId ? conversation : c).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        writeDb(db);
        
        broadcast(conversation); // Broadcast the updated conversation
        res.status(201).json(botMessage);

    } catch (error) {
        console.error('Failed to send message:', error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});


// --- Webhook Endpoint for Meta ---
app.get('/api/webhook', (req, res) => {
    const db = readDb();
    const VERIFY_TOKEN = db.webhookConfig.verifyToken;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified successfully!');
        res.status(200).send(challenge);
    } else {
        console.error('Webhook verification failed.');
        res.sendStatus(403);
    }
});

app.post('/api/webhook', (req, res) => {
    console.log('POST /api/webhook - Event received:', JSON.stringify(req.body, null, 2));
    const body = req.body;
    const platform = body.object === 'instagram' ? 'Instagram' : 'Facebook';

    if (body.object === 'page' || body.object === 'instagram') {
        body.entry.forEach(entry => {
            const webhookEvent = entry.messaging[0];
            if (webhookEvent && webhookEvent.message && webhookEvent.message.text) {
                const senderId = webhookEvent.sender.id;
                const messageText = webhookEvent.message.text;

                const db = readDb();
                let conversation = db.conversations.find(c => c.customer.id === senderId);

                const userMessage = {
                    id: `msg_user_${Date.now()}`,
                    text: messageText,
                    sender: 'user',
                    timestamp: new Date(webhookEvent.timestamp).toISOString(),
                    type: 'Private Message'
                };

                if (conversation) {
                    conversation.messages.push(userMessage);
                    conversation.lastMessagePreview = messageText.substring(0, 40) + '...';
                    conversation.timestamp = userMessage.timestamp;
                    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
                } else {
                    conversation = {
                        id: `conv_${senderId}`,
                        customer: { id: senderId, username: `User ${senderId}`, realName: `New ${platform} User`, platform: platform, avatarUrl: `https://picsum.photos/seed/${senderId}/100/100`, tags: ['New Lead'], phone: '', email: '', notes: '' },
                        messages: [userMessage],
                        lastMessagePreview: messageText.substring(0, 40) + '...',
                        unreadCount: 1,
                        timestamp: userMessage.timestamp,
                    };
                    db.conversations.unshift(conversation);
                }
                
                db.conversations.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                writeDb(db);
                console.log(`Processed and saved message from ${senderId} on ${platform}`);
                broadcast(conversation); // Broadcast the updated conversation to all clients
            }
        });
    }
    res.status(200).send('EVENT_RECEIVED');
});

// --- Start Server ---
server.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
    readDb();
});
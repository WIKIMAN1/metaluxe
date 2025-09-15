const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'db.json');

const { initialRules, initialServices } = require('./mock.js');

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());


// --- Helper Functions ---

// Robust function to read and initialize the database
const readDb = () => {
    if (!fs.existsSync(DB_PATH)) {
        console.log('db.json not found, creating with default values.');
        const defaultStructure = {
            connections: [
                { platform: 'Facebook', connected: false, appId: '', appSecret: '', pageId: '', accessToken: '' },
                { platform: 'Instagram', connected: false, appId: '', appSecret: '', pageId: '', accessToken: '' },
                { platform: 'TikTok', connected: false, appId: '', appSecret: '', pageId: '', accessToken: '' },
                { platform: 'WhatsApp', connected: false, appId: '', appSecret: '', pageId: '', accessToken: '' },
            ],
            aiConfig: { apiKey: '' },
            webhookConfig: { 
                verifyToken: `metaluxe-token-${Date.now()}`,
                callbackUrl: 'YOUR_RENDER_URL/api/webhook' // Placeholder
            },
            conversations: [], // Start with empty conversations
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(defaultStructure, null, 2));
        return defaultStructure;
    }
    
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        const parsedData = JSON.parse(data);
        
        // Ensure critical structures exist to prevent crashes
        if (!parsedData.conversations) parsedData.conversations = [];
        if (!parsedData.connections) parsedData.connections = [];
        if (!parsedData.aiConfig) parsedData.aiConfig = { apiKey: '' };
        if (!parsedData.webhookConfig) parsedData.webhookConfig = { verifyToken: `metaluxe-token-${Date.now()}`, callbackUrl: '' };

        return parsedData;
    } catch (error) {
        console.error("Error reading or parsing db.json, creating a new one:", error);
        fs.unlinkSync(DB_PATH); // Delete corrupted file
        return readDb(); // Recurse to create a fresh one
    }
};

const writeDb = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// --- API Endpoints for Static Data (Automation Rules, Services) ---

app.get('/api/automation-rules', (req, res) => {
    res.json(initialRules);
});

app.get('/api/services', (req, res) => {
    res.json(initialServices);
});


// --- API Endpoints for Dynamic Data (DB) ---

app.get('/api/conversations', (req, res) => {
    const db = readDb();
    res.json(db.conversations || []);
});

app.get('/api/connections', (req, res) => {
    const db = readDb();
    res.json(db.connections);
});

app.post('/api/connections', (req, res) => {
    const updatedConnection = req.body;
    const db = readDb();
    db.connections = db.connections.map(c => 
        c.platform === updatedConnection.platform ? { ...c, ...updatedConnection } : c
    );
    writeDb(db);
    res.status(200).json({ message: 'Connection updated successfully' });
});

app.get('/api/ai-config', (req, res) => {
    const db = readDb();
    res.json(db.aiConfig);
});

app.post('/api/ai-config', (req, res) => {
    const { apiKey } = req.body;
    const db = readDb();
    db.aiConfig = { apiKey };
    writeDb(db);
    res.status(200).json({ message: 'AI configuration saved.' });
});

app.get('/api/webhook-config', (req, res) => {
    const db = readDb();
    res.json(db.webhookConfig);
});

app.post('/api/webhook-config', (req, res) => {
    const { verifyToken } = req.body;
    const db = readDb();
    db.webhookConfig = { ...db.webhookConfig, verifyToken };
    writeDb(db);
    res.status(200).json({ message: 'Webhook token updated.' });
});


// --- Webhook Endpoint for Meta ---

// Verification Request (when you set up the webhook in Facebook)
app.get('/api/webhook', (req, res) => {
    console.log('GET /api/webhook - Verification request from Meta');
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

// Event Notifications (when a new message arrives)
app.post('/api/webhook', (req, res) => {
    console.log('POST /api/webhook - Event received:', JSON.stringify(req.body, null, 2));

    try {
        const body = req.body;
        if (body.object === 'page') {
            body.entry.forEach(entry => {
                if (!entry.messaging || !entry.messaging[0]) {
                    return;
                }
                const messagingEvent = entry.messaging[0];
                
                // FIX: Only process actual text messages to prevent crashes from other events (e.g., delivery receipts)
                if (messagingEvent.message && messagingEvent.message.text) {
                    const senderId = messagingEvent.sender.id;
                    const messageText = messagingEvent.message.text;

                    const db = readDb();
                    let conversation = db.conversations.find(c => c.customer.id === senderId);

                    const userMessage = {
                        id: `msg_user_${Date.now()}`,
                        text: messageText,
                        sender: 'user',
                        timestamp: new Date().toISOString(),
                        type: 'Private Message'
                    };

                    if (conversation) {
                        conversation.messages.push(userMessage);
                        conversation.lastMessagePreview = messageText.substring(0, 40) + '...';
                        conversation.timestamp = userMessage.timestamp;
                    } else {
                        conversation = {
                            id: `conv_${senderId}`,
                            customer: { id: senderId, username: `Messenger User ${senderId}`, realName: `Messenger User ${senderId}`, platform: 'Facebook', avatarUrl: `https://picsum.photos/seed/${senderId}/100/100`, tags: ['New Lead'], phone: '', email: '', notes: '' },
                            messages: [userMessage],
                            lastMessagePreview: messageText.substring(0, 40) + '...',
                            unreadCount: 1,
                            timestamp: userMessage.timestamp,
                        };
                        db.conversations.unshift(conversation); // Add to the beginning
                    }
                    
                    // Simulate AI response for demonstration
                    const botResponse = {
                         id: `msg_bot_${Date.now()}`,
                         text: `[Eva AI response to: "${messageText}"]`,
                         sender: 'bot',
                         timestamp: new Date().toISOString(),
                         type: 'Private Message'
                    };
                    conversation.messages.push(botResponse);
                    
                    db.conversations.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    writeDb(db);
                    console.log(`Processed and saved message from ${senderId}`);
                }
            });
        }
        res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
        console.error('Error processing webhook event:', error);
        res.status(500).send('INTERNAL_SERVER_ERROR');
    }
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
    readDb(); // Initialize DB on start
});
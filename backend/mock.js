const initialRules = [
    { 
      id: 'rule1', 
      platform: 'Facebook', 
      trigger: 'comment', 
      keywords: ['price', 'info', 'cost'], 
      publicReply: '¡Hola! Te hemos enviado la información por mensaje directo 👋', 
      systemPrompt: 'You are a friendly and professional salon assistant. The user commented asking for price/info. Inform them that you are here to help and provide the pricing for a Full Facial Cleansing, which is $80. Ask if they would like to book an appointment.' 
    },
    { 
      id: 'rule2', 
      platform: 'Instagram', 
      trigger: 'comment', 
      keywords: ['appointment', 'book'], 
      publicReply: '¡Claro! Te envío un DM para agendar tu cita. ✨', 
      systemPrompt: 'You are a friendly and efficient salon assistant. The user wants to book an appointment. Provide them with the Calendly link: https://calendly.com/salon-demo/30min and encourage them to book a slot that works for them.' 
    },
     { 
      id: 'rule3', 
      platform: 'TikTok', 
      trigger: 'comment', 
      keywords: ['info', 'precio', 'agendar'], 
      publicReply: '¡Hola! Revisa el enlace en nuestro perfil para ver todos los precios y agendar. 💖', 
      systemPrompt: 'You are a fun and trendy salon assistant for TikTok. The user is asking for info. The TikTok API does not allow sending DMs from comments. Publicly tell them to check the link in the bio for all info and booking, using emojis.' 
    },
];

const initialServices = [
    { id: 'serv1', name: 'Botox Application', price: '$250', description: 'Per area, reduces wrinkles and fine lines.' },
    { id: 'serv2', name: 'Full Facial Cleansing', price: '$80', description: 'Deep cleansing, exfoliation, and hydration.' },
    { id: 'serv3', name: 'Laser Hair Removal (Legs)', price: '$150', description: 'Full leg session using diode laser.' },
];

module.exports = { initialRules, initialServices };

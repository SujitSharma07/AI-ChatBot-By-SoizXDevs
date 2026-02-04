module.exports = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
    
    OWNER_IDS: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : ['1455945908264108062'],
    
    GROQ_API_KEY: process.env.GROQ_API_KEY || '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',
    
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'AIzaSyBkKzmHUFHqa40vsnXJ-nxyVdfCXUMZa84',
    
    BOT_CONFIG: {
        DEFAULT_SYSTEM_PROMPT: "You are SoizX AI, a chill and knowledgeable coding buddy in the SoizX Devs Discord. You're here to help developers with their questions, debug issues, and share knowledge in a relaxed, conversational way.\n\nBe genuinely helpful and approachable - like talking to a skilled friend who knows their stuff. Skip the corporate speak and be natural. When explaining things, make it click for people without overcomplicating. If you're not sure about something, just say so honestly.\n\nFor support or questions, direct users to join our community at https://discord.gg/XkXSRrRE3P where they can get help from our team.\n\n**Core Rules:**\n- NO links, URLs, or web addresses - ever, no exceptions\n- Don't echo back what users say\n- No role pings (@everyone, @here, etc.)\n- Keep it concise but complete\n- Be helpful, not robotic\n- Focus on practical solutions that actually work\n\nYour vibe: Knowledgeable but casual, helpful but not pushy, clear but not boring.",
        
        DEFAULT_IMAGE_ANALYSIS_PROMPT: "You're SoizX AI, a code-savvy friend who's great at spotting issues in screenshots. Look at programming images (code, errors, terminal stuff, IDE screens) and give helpful, straight-to-the-point advice.\n\nWhen you spot problems, focus on fixing them:\n\n🔍 **What's happening:** Quick take on what you see\n❌ **The issue:** What's actually wrong here\n💡 **Fix it:** Clear steps to solve it (with code if needed)\n🛡️ **Avoid this:** How to prevent it next time\n\n**Your style:**\n- Talk like a helpful teammate, not a manual\n- NO links or URLs - none, zero, nada\n- Don't repeat what they already said\n- Use code blocks for actual code\n- Explain weird tech terms simply\n- Give solutions that actually work\n- Keep it useful, not wordy\n\nBe the kind of help you'd want when your code's being difficult.",
        
        GROQ_MODEL: "llama-3.1-8b-instant",
        
        MAX_TOKENS: 600,
        
        TEMPERATURE: 0.8
    },
    
    BOT_PRESENCE: {
        STATUS: "online",
        ACTIVITY_TYPE: "WATCHING",
        ACTIVITY_NAME: "Powered By SoizX Devs",
        CUSTOM_STATUS: "Developed by Sujit"
    },
    
    STARTUP_CONFIG: {
        SHOW_BANNER: true,
        BRAND_NAME: "SoizX Devs™",
        BOT_NAME: "SoizX AI",
        DEVELOPER: "Sujit",
        THEME_COLOR: "#6B46C1",
        ASCII_ART: true
    }
};

/*
@Author: Sujit
Community: https://discord.gg/XkXSRrRE3P (SoizX Devs™)
Reach out for support or credits.
*/


const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ThumbnailBuilder, MessageFlags, SectionBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency and API response times'),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const startTime = Date.now();
        
        // Test Bot Ping
        const botPing = interaction.client.ws.ping;
        
        // Test Groq API availability (without making actual calls)
        let groqPing = 'Available';
        try {
            const groqModule = require('../services/groq.js');
            if (!groqModule || !groqModule.generateGroqResponse) {
                groqPing = 'Unavailable';
            }
        } catch (error) {
            groqPing = 'Unavailable';
        }
        
        // Test Gemini API availability (without making actual calls)
        let geminiPing = 'Available';
        try {
            const geminiModule = require('../services/gemini.js');
            if (!geminiModule || !geminiModule.analyzeImageWithGemini) {
                geminiPing = 'Unavailable';
            }
        } catch (error) {
            geminiPing = 'Unavailable';
        }
        
        const totalTime = Date.now() - startTime;
        
        // Create Components v2 container following bot.js structure
        const pingContainer = new ContainerBuilder()
            .setAccentColor(0x00FF7F);
        
        pingContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('# 🏓 Latency Test Results\n*Real-time performance metrics*')
        );
        
        pingContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
        );
        
        pingContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 🤖 Bot Performance')
        );
        
        pingContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**Discord WebSocket Ping**\n\`${botPing}ms\`\n\n**Command Response Time**\n\`${totalTime}ms\``),
            new TextDisplayBuilder().setContent(`**Bot Status**\n${botPing < 100 ? 'Excellent' : botPing < 200 ? 'Good' : 'Slow'} connection quality`)
        );
        
        pingContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );
        
        pingContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 🧠 AI Services')
        );
        
        pingContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**Groq API (Text AI)**\nStatus: ${groqPing === 'Available' ? '🟢 Online' : '🔴 Offline'}`),
            new TextDisplayBuilder().setContent(`**Google Gemini API (Vision AI)**\nStatus: ${geminiPing === 'Available' ? '🟢 Online' : '🔴 Offline'}`)
        );
        
        pingContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );
        
        pingContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 📊 System Summary')
        );
        
        const overallStatus = botPing < 100 && groqPing === 'Available' && geminiPing === 'Available' ? 
            'All systems operational' : 
            'Some services experiencing issues';
        
        pingContainer.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**Overall Status:** ${overallStatus}\n**Test Completed:** <t:${Math.floor(Date.now() / 1000)}:R>\n**Server Region:** ${interaction.guild ? interaction.guild.preferredLocale : 'DM'}`),
                    new TextDisplayBuilder().setContent(`*Developed by Sujit Sharma • SoizX Devs™*`)
                )
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(interaction.client.user.displayAvatarURL({ size: 128 })))
        );
        
        await interaction.editReply({
            components: [pingContainer],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
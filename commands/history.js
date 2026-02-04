const { SlashCommandBuilder } = require('discord.js');
const { getUserHistory, getChannelHistory } = require('../services/messageHistory.js');
const { checkOwnerPermission } = require('../utils/permissions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('View your conversation history')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view history for (Owner only)')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('channel_only')
                .setDescription('Show only this channel\'s history')
                .setRequired(false)),
    async execute(interaction) {
        const requestedUser = interaction.options.getUser('user');
        const channelOnly = interaction.options.getBoolean('channel_only') || false;
        
        if (requestedUser && !checkOwnerPermission(interaction.user.id)) {
            await interaction.reply({
                content: 'You can only view other users\' history if you are the bot owner.',
                flags: 64
            });
            return;
        }

        const targetUser = requestedUser || interaction.user;
        
        try {
            let history;
            let historyType;
            
            if (channelOnly) {
                history = await getChannelHistory(targetUser.id, interaction.channel.id, 15);
                historyType = `in #${interaction.channel.name}`;
            } else {
                history = await getUserHistory(targetUser.id, 15);
                historyType = `across all channels`;
            }
            
            if (history.length === 0) {
                await interaction.reply({
                    content: `No conversation history found for ${targetUser.tag} ${historyType}.`,
                    flags: 64
                });
                return;
            }

            const formattedHistory = history.map(msg => {
                const timestamp = new Date(msg.createdAt).toLocaleString();
                const role = msg.role === 'user' ? '👤 User' : '🤖 Bot';
                const content = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
                return `**${role}** (${timestamp})\n${content}`;
            }).join('\n\n');

            await interaction.reply({
                content: `**Conversation History for ${targetUser.tag} ${historyType}:**\n\n${formattedHistory}`,
                flags: 64
            });
        } catch (error) {
            console.error('Error fetching history:', error);
            await interaction.reply({
                content: 'Failed to fetch conversation history.',
                flags: 64
            });
        }
    },
};
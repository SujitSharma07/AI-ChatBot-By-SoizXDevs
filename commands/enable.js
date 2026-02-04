const { SlashCommandBuilder } = require('discord.js');
const { checkOwnerPermission } = require('../utils/permissions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enable')
        .setDescription('Enable AI bot responses in this channel (Owner only)'),
    
    async execute(interaction, { enabledChannels }) {
        if (!checkOwnerPermission(interaction.user.id)) {
            await interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
            return;
        }

        if (!interaction.guild) {
            await interaction.reply({
                content: 'This command can only be used in a server.',
                ephemeral: true
            });
            return;
        }

        const channelId = interaction.channel.id;
        
        enabledChannels[channelId] = true;
        
        const { saveChannelsData } = require('../bot.js');
        saveChannelsData();

        await interaction.reply({
            content: `✅ AI bot responses have been **enabled** in this channel.`,
            ephemeral: false
        });
    }
};
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkOwnerPermission } = require('../utils/permissions');
const fs = require('fs');
const path = require('path');

const blacklistPath = path.join(__dirname, '..', 'data', 'blacklist.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklistlist')
        .setDescription('List all blacklisted users (Owner only)'),

    async execute(interaction) {
        if (!checkOwnerPermission(interaction.user.id)) {
            await interaction.reply({
                content: '❌ This command is restricted to bot owners only.',
                ephemeral: true
            });
            return;
        }

        try {
            if (!fs.existsSync(blacklistPath)) {
                await interaction.reply({
                    content: '📋 No users are currently blacklisted.',
                    ephemeral: true
                });
                return;
            }

            const fileContent = fs.readFileSync(blacklistPath, 'utf8');
            const blacklistData = JSON.parse(fileContent);

            if (!blacklistData.blacklistedUsers || blacklistData.blacklistedUsers.length === 0) {
                await interaction.reply({
                    content: '📋 No users are currently blacklisted.',
                    ephemeral: true
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🚫 AI Blacklist')
                .setDescription(`Total blacklisted users: ${blacklistData.blacklistedUsers.length}`)
                .setColor(0xFF0000)
                .setTimestamp();

            blacklistData.blacklistedUsers.forEach((entry, index) => {
                const blacklistedDate = new Date(entry.blacklistedAt).toLocaleDateString();
                embed.addFields({
                    name: `${index + 1}. ${entry.username}`,
                    value: `**ID:** ${entry.userId}\n**Reason:** ${entry.reason}\n**Date:** ${blacklistedDate}`,
                    inline: true
                });
            });

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error listing blacklisted users:', error);
            await interaction.reply({
                content: '❌ An error occurred while retrieving the blacklist.',
                ephemeral: true
            });
        }
    }
};

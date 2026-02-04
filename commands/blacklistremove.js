const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkOwnerPermission } = require('../utils/permissions');
const fs = require('fs');
const path = require('path');

const blacklistPath = path.join(__dirname, '..', 'data', 'blacklist.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklistremove')
        .setDescription('Remove a user from the AI blacklist (Owner only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove from the blacklist')
                .setRequired(true)),

    async execute(interaction) {
        if (!checkOwnerPermission(interaction.user.id)) {
            await interaction.reply({
                content: '❌ This command is restricted to bot owners only.',
                ephemeral: true
            });
            return;
        }

        const targetUser = interaction.options.getUser('user');

        try {
            if (!fs.existsSync(blacklistPath)) {
                await interaction.reply({
                    content: `⚠️ **${targetUser.tag}** is not blacklisted.`,
                    ephemeral: true
                });
                return;
            }

            const fileContent = fs.readFileSync(blacklistPath, 'utf8');
            let blacklistData = JSON.parse(fileContent);

            const originalLength = blacklistData.blacklistedUsers.length;
            blacklistData.blacklistedUsers = blacklistData.blacklistedUsers.filter(entry => entry.userId !== targetUser.id);

            if (blacklistData.blacklistedUsers.length === originalLength) {
                await interaction.reply({
                    content: `⚠️ **${targetUser.tag}** is not blacklisted.`,
                    ephemeral: true
                });
                return;
            }

            fs.writeFileSync(blacklistPath, JSON.stringify(blacklistData, null, 2));

            await interaction.reply({
                content: `✅ **${targetUser.tag}** has been removed from the AI blacklist.`,
                ephemeral: true
            });

            console.log(`User ${targetUser.tag} (${targetUser.id}) removed from blacklist by ${interaction.user.tag} (${interaction.user.id})`);

        } catch (error) {
            console.error('Error removing user from blacklist:', error);
            await interaction.reply({
                content: '❌ An error occurred while removing the user from the blacklist.',
                ephemeral: true
            });
        }
    }
};

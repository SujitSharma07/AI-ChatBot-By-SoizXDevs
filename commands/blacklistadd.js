const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkOwnerPermission } = require('../utils/permissions');
const fs = require('fs');
const path = require('path');

const blacklistPath = path.join(__dirname, '..', 'data', 'blacklist.json');

if (!fs.existsSync(blacklistPath)) {
    fs.writeFileSync(blacklistPath, JSON.stringify({ blacklistedUsers: [] }, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklistadd')
        .setDescription('Add a user to the AI blacklist (Owner only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to blacklist from AI responses')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for blacklisting (optional)')
                .setRequired(false)),

    async execute(interaction) {
        if (!checkOwnerPermission(interaction.user.id)) {
            await interaction.reply({
                content: '❌ This command is restricted to bot owners only.',
                ephemeral: true
            });
            return;
        }

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            let blacklistData = { blacklistedUsers: [] };
            if (fs.existsSync(blacklistPath)) {
                const fileContent = fs.readFileSync(blacklistPath, 'utf8');
                blacklistData = JSON.parse(fileContent);
            }

            const existingEntry = blacklistData.blacklistedUsers.find(entry => entry.userId === targetUser.id);
            if (existingEntry) {
                await interaction.reply({
                    content: `⚠️ **${targetUser.tag}** is already blacklisted.\n**Reason:** ${existingEntry.reason}`,
                    ephemeral: true
                });
                return;
            }

            blacklistData.blacklistedUsers.push({
                userId: targetUser.id,
                username: targetUser.tag,
                reason: reason,
                blacklistedBy: interaction.user.id,
                blacklistedAt: new Date().toISOString()
            });

            fs.writeFileSync(blacklistPath, JSON.stringify(blacklistData, null, 2));

            await interaction.reply({
                content: `✅ **${targetUser.tag}** has been added to the AI blacklist.\n**Reason:** ${reason}`,
                ephemeral: true
            });

            console.log(`User ${targetUser.tag} (${targetUser.id}) blacklisted by ${interaction.user.tag} (${interaction.user.id}). Reason: ${reason}`);

        } catch (error) {
            console.error('Error adding user to blacklist:', error);
            await interaction.reply({
                content: '❌ An error occurred while adding the user to the blacklist.',
                ephemeral: true
            });
        }
    }
};

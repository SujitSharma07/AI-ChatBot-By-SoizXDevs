const { SlashCommandBuilder } = require('discord.js');
const { db } = require('../db/database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearhistory')
        .setDescription('Clear your conversation history'),
    async execute(interaction) {
        try {
            const stmt = db.prepare('DELETE FROM user_messages WHERE userId = ?');
            const result = stmt.run(interaction.user.id);
            
            await interaction.reply({
                content: `✅ Your conversation history has been cleared! (${result.changes} messages deleted)`,
                flags: 64
            });
        } catch (error) {
            console.error('Error clearing history:', error);
            await interaction.reply({
                content: 'There was an error clearing your history. Please try again later.',
                flags: 64
            });
        }
    },
};
const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { checkOwnerPermission } = require('../utils/permissions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editsystemprompt')
        .setDescription('Edit the system prompt for text responses (Owner only)'),
    
    async execute(interaction, { systemPrompt }) {
        if (!checkOwnerPermission(interaction.user.id)) {
            await interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId('editsystemprompt')
            .setTitle('Edit System Prompt');

        const promptInput = new TextInputBuilder()
            .setCustomId('systemPromptInput')
            .setLabel('System Prompt for Text Responses')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter the new system prompt...')
            .setValue(systemPrompt)
            .setRequired(true)
            .setMaxLength(2000);

        const actionRow = new ActionRowBuilder().addComponents(promptInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }
};
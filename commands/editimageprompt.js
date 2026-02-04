const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { checkOwnerPermission } = require('../utils/permissions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editimageprompt')
        .setDescription('Edit the image analysis prompt for the AI bot (Owner only)'),
    
    async execute(interaction, { imageAnalysisPrompt }) {
        if (!checkOwnerPermission(interaction.user.id)) {
            await interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId('editimageprompt')
            .setTitle('Edit Image Analysis Prompt');

        const promptInput = new TextInputBuilder()
            .setCustomId('imagePromptInput')
            .setLabel('Image Analysis Prompt')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter the new image analysis prompt...')
            .setValue(imageAnalysisPrompt)
            .setRequired(true)
            .setMaxLength(2000);

        const actionRow = new ActionRowBuilder().addComponents(promptInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }
};
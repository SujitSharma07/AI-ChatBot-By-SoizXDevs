const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('showimageprompt')
        .setDescription('Show the current image analysis prompt'),
    
    async execute(interaction, { imageAnalysisPrompt }) {
        const container = new ContainerBuilder()
            .setAccentColor(0x00AE86)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('# 🖼️ Current Image Analysis Prompt')
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`\`\`\`${imageAnalysisPrompt}\`\`\``)
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('SoizX Development')
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            ephemeral: true
        });
    }
};
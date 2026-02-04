const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('showsystemprompt')
        .setDescription('Show the current system prompt for text responses'),
    
    async execute(interaction, { systemPrompt }) {
        const container = new ContainerBuilder()
            .setAccentColor(0x00AE86)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('# 🤖 Current System Prompt')
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`\`\`\`${systemPrompt}\`\`\``)
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

/*
@Author: Aegis
Community: https://discord.strelix.xyz (Strelix Studios™)
Reach out for support or credits.
*/



const { 
    SlashCommandBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    MessageFlags,
    SeparatorSpacingSize,
    ButtonStyle 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all available commands and their usage'),
    
    async execute(interaction, isRefresh = false) {
        const container = new ContainerBuilder()
            .setAccentColor(0x5865F2);

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('# 🤖 Strelix AI - Command Guide\n*Your AI-powered coding assistant for Discord*')
        );
        
        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 📖 Overview'),
            new TextDisplayBuilder().setContent('**Version**: 3.0 | **Powered By**: Groq AI + Google Gemini\n**Developer**: SoizX Devs™ | **Made By**: Sujit Sharma\n\nSelect a category below to explore commands, or use the action buttons for quick access.')
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 📋 Command Categories')
        );

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('help_category_select')
                    .setPlaceholder('🔍 Select a command category to explore...')
                    .addOptions([
                        new StringSelectMenuOptionBuilder()
                            .setLabel('👤 User Commands')
                            .setValue('user_commands')
                            .setDescription('Commands available to everyone'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🧠 AI Features')
                            .setValue('ai_features')
                            .setDescription('Smart AI capabilities and integrations'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('⚙️ Channel Management')
                            .setValue('channel_management')
                            .setDescription('Enable/disable AI in channels (Owner only)'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🔧 Bot Configuration')
                            .setValue('bot_config')
                            .setDescription('System prompts and settings (Owner only)'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('💬 Natural Language')
                            .setValue('natural_language')
                            .setDescription('Chat directly without commands')
                    ])
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## ⚡ Quick Actions')
        );

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('help_examples')
                    .setLabel('📝 Usage Examples')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('help_features')
                    .setLabel('✨ AI Features')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('help_refresh')
                    .setLabel('🔄 Refresh')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('help_support')
                    .setLabel('🆘 Get Support')
                    .setStyle(ButtonStyle.Success)
            )
        );

        if (isRefresh) {
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    components: [container],
                    flags: MessageFlags.IsComponentsV2
                });
            } else {
                await interaction.reply({
                    components: [container],
                    flags: MessageFlags.IsComponentsV2
                });
            }
        } else {
            await interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }
    }
};
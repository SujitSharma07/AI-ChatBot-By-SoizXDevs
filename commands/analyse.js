const { SlashCommandBuilder } = require('discord.js');
const { analyzeImageWithGemini } = require('../services/gemini.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('analyse')
        .setDescription('Debug image analysis with detailed logging')
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Image to analyze')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        
        const attachment = interaction.options.getAttachment('image');
        
        if (!attachment) {
            await interaction.editReply('Please provide an image to analyze.');
            return;
        }

        if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
            await interaction.editReply('Please provide a valid image file.');
            return;
        }

        console.log('=== DEBUG ANALYSE COMMAND ===');
        console.log('Attachment URL:', attachment.url);
        console.log('Content Type:', attachment.contentType);
        console.log('File size:', attachment.size);
        
        try {
            const result = await analyzeImageWithGemini(attachment.url);
            
            try {
                const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
                
                if (result.length > 3500) {
                    const truncatedText = result.substring(0, 1800) + '...\n\n*Analysis truncated to fit Discord limits*';
                    await interaction.editReply({
                        content: `🔍 **Debug Image Analysis**\n*Detailed analysis with debug information*\n\n${truncatedText}`
                    });
                    return;
                }
                
                const analysisContainer = new ContainerBuilder()
                    .setAccentColor(0x57F287);
                
                analysisContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# 🔍 Debug Image Analysis\n*Detailed analysis with debug information*')
                );
                
                analysisContainer.addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
                );
                
                const sections = result.split(/(?=\*\*[🔍🧠❌💡🛡️🖼️🎨💬][^*]+\*\*)/);
                const sectionsToProcess = sections.length > 1 ? sections : [result];
                
                let componentsAdded = 0;
                const maxComponents = 5;
                
                for (let i = 0; i < sectionsToProcess.length && componentsAdded < maxComponents; i++) {
                    const section = sectionsToProcess[i].trim();
                    if (!section) continue;
                    
                    const truncatedSection = section.length > 800 ? 
                        section.substring(0, 800) + '...' : 
                        section;
                    
                    analysisContainer.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(truncatedSection)
                    );
                    
                    componentsAdded++;
                    
                    if (i < sectionsToProcess.length - 1 && componentsAdded < maxComponents) {
                        analysisContainer.addSeparatorComponents(
                            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                        );
                    }
                }
                
                await interaction.editReply({
                    components: [analysisContainer],
                    flags: MessageFlags.IsComponentsV2
                });
            } catch (containerError) {
                console.error('Container error, falling back to regular message:', containerError);
                const truncatedText = result.length > 1800 ? 
                    result.substring(0, 1800) + '...\n\n*Analysis truncated due to length*' : 
                    result;
                await interaction.editReply({
                    content: `🔍 **Debug Image Analysis**\n\n${truncatedText}`
                });
            }
        } catch (error) {
            console.error('Debug command error:', error);
            await interaction.editReply('❌ Failed to analyze image. Check console for details.');
        }
    },
};

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { generateGroqResponse } = require('../services/groq.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whois')
        .setDescription('Get an AI-generated profile summary of a Discord user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to analyze')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        
        const targetUser = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(targetUser.id);
        
        if (!member) {
            await interaction.editReply('User not found in this server.');
            return;
        }

        try {
            // Special handling for Sujit (the creator)
            if (targetUser.id === '1455945908264108062') {
                const aegisContainer = new ContainerBuilder()
                    .setAccentColor(0x00AE86)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('# 🔧 Meet Sujit Sharma - Founder & Bot Creator')
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`That's <@1455945908264108062>, the Founder of SoizX Devs™ and the developer who specifically created me, SoizX AI!`)
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('**👑 Founder**\nCo-founder of SoizX Devs™ with hiro.null'),
                        new TextDisplayBuilder().setContent('**🤖 My Creator**\nBuilt SoizX AI from scratch'),
                        new TextDisplayBuilder().setContent('**🧠 AI Integration Expert**\nImplemented complex AI features and Discord integrations'),
                        new TextDisplayBuilder().setContent('**⚡ Feature Developer**\nProgrammed image analysis, memory, and user profiles')
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`Founder & Bot Creator | User ID: ${targetUser.id}`)
                    );

                await interaction.editReply({ 
                    components: [aegisContainer], 
                    flags: MessageFlags.IsComponentsV2 
                });
                return;
            }
            
            const userInfo = {
                username: targetUser.username,
                displayName: member.displayName,
                discriminator: targetUser.discriminator,
                id: targetUser.id,
                accountCreated: targetUser.createdAt,
                joinedServer: member.joinedAt,
                roles: member.roles.cache
                    .filter(role => role.name !== '@everyone')
                    .map(role => role.name)
                    .slice(0, 10),
                isBot: targetUser.bot,
                avatar: targetUser.displayAvatarURL(),
                status: member.presence?.status || 'offline',
                activities: member.presence?.activities?.map(activity => ({
                    name: activity.name,
                    type: activity.type,
                    details: activity.details
                })) || [],
                nickname: member.nickname,
                permissions: member.permissions.toArray().slice(0, 15),
                highestRole: member.roles.highest.name,
                roleColor: member.roles.highest.color
            };

            const analysisPrompt = `Analyze this Discord user's profile data and provide a concise, friendly summary about who they are in the server community. Focus on their roles, activity, and what kind of member they appear to be.

User Data:
- Username: ${userInfo.username}
- Display Name: ${userInfo.displayName}
- Account Created: ${userInfo.accountCreated.toDateString()}
- Joined Server: ${userInfo.joinedServer.toDateString()}
- Roles: ${userInfo.roles.join(', ') || 'None'}
- Highest Role: ${userInfo.highestRole}
- Bot Account: ${userInfo.isBot}
- Current Status: ${userInfo.status}
- Activities: ${userInfo.activities.map(a => a.name).join(', ') || 'None'}
- Nickname: ${userInfo.nickname || 'None'}
- Key Permissions: ${userInfo.permissions.slice(0, 5).join(', ')}

Write a short paragraph (under 200 words) describing this user's profile, their role in the server, and what kind of member they appear to be. Be respectful and focus on positive aspects. If they're a bot, mention that. If they have special roles or permissions, highlight those appropriately.`;

            const aiSummary = await generateGroqResponse(analysisPrompt, "You are a helpful assistant that analyzes Discord user profiles. Be respectful, positive, and concise.", []);

            const userContainer = new ContainerBuilder()
                .setAccentColor(userInfo.roleColor || 0x00AE86)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`# 🔍 User Profile: ${userInfo.displayName}`)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(aiSummary)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('**📊 Quick Stats**'),
                    new TextDisplayBuilder().setContent(`**Joined:** ${userInfo.joinedServer.toDateString()}\n**Roles:** ${userInfo.roles.length}\n**Status:** ${userInfo.status}`),
                    new TextDisplayBuilder().setContent('**👑 Highest Role**'),
                    new TextDisplayBuilder().setContent(userInfo.highestRole),
                    new TextDisplayBuilder().setContent('**🎯 Top Roles**'),
                    new TextDisplayBuilder().setContent(userInfo.roles.slice(0, 5).join(', ') || 'None')
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`User ID: ${userInfo.id}`)
                );

            await interaction.editReply({ 
                components: [userContainer], 
                flags: MessageFlags.IsComponentsV2 
            });

        } catch (error) {
            console.error('Error in whois command:', error);
            await interaction.editReply('Failed to analyze user profile. Please try again.');
        }
    }
};
const { Client, GatewayIntentBits, Collection, REST, Routes, SlashCommandBuilder, EmbedBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, SectionBuilder, ThumbnailBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.js');
const { checkOwnerPermission } = require('./utils/permissions.js');
const { isUserBlacklisted } = require('./utils/blacklist.js');
const { generateGroqResponse } = require('./services/groq.js');
const { analyzeImageWithGemini } = require('./services/gemini.js');
const { addMessageToHistory, getUserHistory, getChannelHistory, cleanupOldMessages } = require('./services/messageHistory.js');
const { setupMessageHistorySystem } = require('./db/database.js');
const { getWeatherData } = require('./services/webData.js');

class Colors {
    static PURPLE = '\033[95m';
    static CYAN = '\033[96m';
    static PINK = '\033[38;5;213m';
    static LAVENDER = '\033[38;5;183m';
    static BLUE = '\033[94m';
    static GREEN = '\033[92m';
    static YELLOW = '\033[93m';
    static RED = '\033[91m';
    static WHITE = '\033[97m';
    static GRAY = '\033[90m';
    static DARK_GRAY = '\033[38;5;240m';
    static BOLD = '\033[1m';
    static DIM = '\033[2m';
    static UNDERLINE = '\033[4m';
    static RESET = '\033[0m';
    static SOIZX_PINK = '\033[38;5;219m';
    static SOIZX_PURPLE = '\033[38;5;141m';
    static SOIZX_BLUE = '\033[38;5;111m';
}

function displayStartupBanner() {
    const { BRAND_NAME, BOT_NAME, DEVELOPER } = config.STARTUP_CONFIG;
    
    console.clear();
    
    console.log(`\n${Colors.SOIZX_PINK}╭─────────────────────────────────────────────────────────────╮${Colors.RESET}`);
    console.log(`${Colors.SOIZX_PINK}│${Colors.RESET}                    ${Colors.BOLD}${Colors.SOIZX_PURPLE}✦ SOIZX AI ✦${Colors.RESET}                     ${Colors.SOIZX_PINK}│${Colors.RESET}`);
    console.log(`${Colors.SOIZX_PINK}│${Colors.RESET}            ${Colors.DIM}${Colors.WHITE}Elegant • Intelligent • Sophisticated${Colors.RESET}           ${Colors.SOIZX_PINK}│${Colors.RESET}`);
    console.log(`${Colors.SOIZX_PINK}╰─────────────────────────────────────────────────────────────╯${Colors.RESET}\n`);
}

function printBotReady(botName) {
    console.log(`\n${Colors.SOIZX_BLUE}◆${Colors.RESET} ${Colors.BOLD}${Colors.GREEN}Authentication successful${Colors.RESET} ${Colors.DIM}→${Colors.RESET} ${Colors.SOIZX_PURPLE}${botName}${Colors.RESET}`);
}

function printError(message) {
    console.log(`${Colors.RED}✗${Colors.RESET} ${Colors.BOLD}Error:${Colors.RESET} ${message}`);
}

function printLoading(message) {
    console.log(`${Colors.SOIZX_BLUE}◆${Colors.RESET} ${Colors.DIM}Loading${Colors.RESET} ${Colors.WHITE}${message}${Colors.RESET}${Colors.DIM}...${Colors.RESET}`);
}

function printSuccess(message) {
    console.log(`${Colors.GREEN}✓${Colors.RESET} ${Colors.WHITE}${message}${Colors.RESET}`);
}

function printInfo(message) {
    console.log(`${Colors.SOIZX_PURPLE}ⓘ${Colors.RESET} ${Colors.WHITE}${message}${Colors.RESET}`);
}

function printElegantSeparator() {
    const separator = `${Colors.SOIZX_PINK}─${Colors.SOIZX_PURPLE}─${Colors.SOIZX_BLUE}─${Colors.RESET}`;
    console.log(`   ${separator.repeat(20)}`);
}

function printSystemReady() {
    printElegantSeparator();
    console.log(`\n   ${Colors.BOLD}${Colors.SOIZX_PURPLE}✦ System Operational ✦${Colors.RESET}`);
    console.log(`   ${Colors.DIM}${Colors.WHITE}Developed with ${Colors.SOIZX_PINK}♡ ${Colors.WHITE} by SoizX Devs™${Colors.RESET}`);
    console.log(`   ${Colors.DIM}${Colors.DARK_GRAY}Ready to serve with elegance and precision${Colors.RESET}\n`);
    printElegantSeparator();
    console.log();
}

async function setPresence() {
    const { STATUS, ACTIVITY_TYPE, ACTIVITY_NAME } = config.BOT_PRESENCE;
    
    try {
        await client.user.setPresence({
            activities: [{
                name: ACTIVITY_NAME,
                type: ACTIVITY_TYPE === 'WATCHING' ? 3 : 
                      ACTIVITY_TYPE === 'LISTENING' ? 2 : 
                      ACTIVITY_TYPE === 'PLAYING' ? 0 : 0
            }],
            status: STATUS
        });
        
    } catch (error) {
        printError(`Failed to set presence: ${error.message}`);
    }
}



async function generateUserAnalysis(member, guild) {
    const user = member.user;
    
    const userInfo = {
        username: user.username,
        displayName: member.displayName,
        discriminator: user.discriminator,
        id: user.id,
        accountCreated: user.createdAt,
        joinedServer: member.joinedAt,
        roles: member.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => role.name)
            .slice(0, 10),
        isBot: user.bot,
        avatar: user.displayAvatarURL(),
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

    const response = `🔍 **User Profile: ${userInfo.displayName}**\n\n${aiSummary}\n\n📊 **Quick Stats:**\n• Joined: ${userInfo.joinedServer.toDateString()}\n• Roles: ${userInfo.roles.length}\n• Status: ${userInfo.status}\n• Highest Role: ${userInfo.highestRole}`;

    return response;
}

async function sendLongMessage(message, text) {
    if (text.length <= 2000) {
        return await message.reply(text);
    }
    
    const chunks = [];
    let currentChunk = '';
    const lines = text.split('\n');
    
    for (const line of lines) {
        if (currentChunk.length + line.length + 1 <= 1900) {
            currentChunk += (currentChunk ? '\n' : '') + line;
        } else {
            if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = line;
            } else {
                chunks.push(line.substring(0, 1900));
                currentChunk = line.substring(1900);
            }
        }
    }
    
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    
    await message.reply(chunks[0]);
    
    for (let i = 1; i < chunks.length; i++) {
        await message.channel.send(chunks[i]);
    }
}

async function sendImageAnalysisContainer(message, analysisText) {
    try {
        const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
        
        let totalCharCount = 60;
        const sections = analysisText.split(/(?=\*\*[🔍🧠❌💡🛡️🖼️🎨💬][^*]+\*\*)/);
        const sectionsToProcess = sections.length > 1 ? sections : [analysisText];
        
        const totalTextLength = analysisText.length;
        if (totalTextLength > 3500) {
            const truncatedText = analysisText.substring(0, 1800) + '...\n\n*Analysis truncated to fit Discord limits*';
            await message.reply(`🔍 **Image Analysis**\n*AI-powered visual content analysis*\n\n${truncatedText}`);
            return;
        }
        
        const analysisContainer = new ContainerBuilder()
            .setAccentColor(0x57F287);
        
        analysisContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('# 🔍 Image Analysis\n*AI-powered visual content analysis*')
        );
        
        analysisContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
        );
        
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
        
        await message.reply({
            components: [analysisContainer],
            flags: MessageFlags.IsComponentsV2
        });
    } catch (error) {
        console.error('Error sending image analysis container:', error);
        const truncatedText = analysisText.length > 1800 ? 
            analysisText.substring(0, 1800) + '...\n\n*Analysis truncated due to length*' : 
            analysisText;
        await message.reply(`🔍 **Image Analysis**\n\n${truncatedText}`);
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

client.commands = new Collection();

let enabledChannels = {};
try {
    const channelsData = fs.readFileSync('./data/channels.json', 'utf8');
    enabledChannels = JSON.parse(channelsData);
} catch (error) {
    console.log('No channels data found, starting with empty configuration');
    enabledChannels = {};
}

let systemPrompt = config.BOT_CONFIG.DEFAULT_SYSTEM_PROMPT;
let imageAnalysisPrompt = config.BOT_CONFIG.DEFAULT_IMAGE_ANALYSIS_PROMPT;
try {
    const promptData = fs.readFileSync('./data/systemprompt.json', 'utf8');
    const promptObj = JSON.parse(promptData);
    systemPrompt = promptObj.prompt || config.BOT_CONFIG.DEFAULT_SYSTEM_PROMPT;
    imageAnalysisPrompt = promptObj.imageAnalysisPrompt || config.BOT_CONFIG.DEFAULT_IMAGE_ANALYSIS_PROMPT;
} catch (error) {
    console.log('No system prompt data found, using default');
}

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

async function registerCommands() {
    try {
        const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);
        
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        
    } catch (error) {
        printError(`Failed to register commands: ${error.message}`);
    }
}

client.once('ready', async () => {
    if (config.STARTUP_CONFIG.SHOW_BANNER) {
        displayStartupBanner();
    }
    
    printLoading('Initializing Discord presence');
    await setPresence();
    printSuccess('Discord presence configured');
    
    printLoading('Synchronizing application commands');
    await registerCommands();
    printSuccess('Command synchronization complete');
    
    printLoading('Configuring message history system');
    setupMessageHistorySystem();
    setInterval(async () => {
        await cleanupOldMessages();
    }, 10 * 60 * 1000);
    printSuccess('Message history system initialized');
    
    printBotReady(client.user.tag);
    printSystemReady();
});

client.on('interactionCreate', async interaction => {
    console.log(`=== INTERACTION EVENT TRIGGERED ===`);
    console.log(`Interaction type: ${interaction.type}, User: ${interaction.user.tag}`);
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, { enabledChannels, systemPrompt, imageAnalysisPrompt });
        } catch (error) {
            console.error('Error executing command:', error);
            const errorMessage = 'There was an error while executing this command!';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    } else if (interaction.isModalSubmit()) {
        try {
            await handleModalSubmit(interaction);
        } catch (error) {
            console.error('Error handling modal submit:', error);
            const errorMessage = 'There was an error while processing your submission!';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    } else if (interaction.isStringSelectMenu() || interaction.isButton()) {
        try {
            await handleHelpInteractions(interaction);
        } catch (error) {
            console.error('Error handling help interaction:', error);
            const errorMessage = 'There was an error while processing your request!';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
});

async function handleHelpInteractions(interaction) {
    const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SeparatorSpacingSize, ButtonStyle, MessageFlags } = require('discord.js');
    
    if (interaction.customId === 'help_refresh') {
        await interaction.deferUpdate();
        const helpCommand = client.commands.get('help');
        if (helpCommand) {
            await helpCommand.execute(interaction, true);
        }
    
    } else if (interaction.customId === 'help_examples') {
        const exampleContainer = new ContainerBuilder()
            .setAccentColor(0x57F287);

        exampleContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('# 📝 Usage Examples\n*Practical examples of how to use Strelix AI*')
        );
        exampleContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
        );

        exampleContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 💬 Natural Conversation Examples')
        );
        
        exampleContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('**🐍 Python Help**\n```\n"Help me debug this Python error: NameError"\n"How do I use list comprehensions?"\n"Explain decorators in Python"\n```'),
            new TextDisplayBuilder().setContent('**🌐 Web Development**\n```\n"How do I create a REST API in Node.js?"\n"Explain async/await in JavaScript"\n"Help with React hooks"\n```'),
            new TextDisplayBuilder().setContent('**🖼️ Image Analysis**\n```\n[Upload code screenshot] "What\'s wrong with this code?"\n[Upload diagram] "Explain this architecture"\n[Upload UI mockup] "How would you implement this?"\n```')
        );

        exampleContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

        exampleContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 🌤️ Weather & Utility Examples')
        );

        exampleContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('**Weather Queries**\n```\n"Weather in London"\n"How\'s the weather in Tokyo?"\n"Is it raining in New York?"\n"Temperature in Paris"\n```'),
            new TextDisplayBuilder().setContent('**User Analysis**\n```\n"who is @username" - Natural language\n/whois @username - Slash command\n```')
        );

        exampleContainer.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('help_back_to_main')
                    .setLabel('← Back to Help Menu')
                    .setStyle(ButtonStyle.Secondary)
            )
        );

        await interaction.update({
            components: [exampleContainer],
            flags: MessageFlags.IsComponentsV2
        });
    } else if (interaction.customId === 'help_features') {
        const featureContainer = new ContainerBuilder()
            .setAccentColor(0xFEE75C);

        featureContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('# ✨ AI Features Overview\n*Cutting-edge artificial intelligence capabilities*')
        );
        featureContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
        );

        featureContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('**🚀 Groq AI Integration**\nPowered by Llama3 model for lightning-fast responses with deep programming knowledge and general intelligence.'),
            new TextDisplayBuilder().setContent('**👁️ Google Gemini Vision**\nAdvanced image analysis that can read code screenshots, understand diagrams, analyze UI mockups, and explain visual content.'),
            new TextDisplayBuilder().setContent('**🧠 Conversation Memory**\nMaintains context within channels, remembering your conversation history for more intelligent and coherent responses.')
        );

        featureContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

        featureContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('**🌍 Real-time Weather Data**\nGet current weather information for any city worldwide with detailed atmospheric conditions.'),
            new TextDisplayBuilder().setContent('**👤 AI User Analysis**\nAnalyze Discord user profiles with AI-generated insights about roles, activity, and server participation.'),
            new TextDisplayBuilder().setContent('**📱 Components v2 UI**\nModern interactive interface with categorized menus, buttons, and rich content displays.')
        );

        featureContainer.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('help_back_to_main')
                    .setLabel('← Back to Help Menu')
                    .setStyle(ButtonStyle.Secondary)
            )
        );

        await interaction.update({
            components: [featureContainer],
            flags: MessageFlags.IsComponentsV2
        });
    } else if (interaction.customId === 'help_support') {
        const supportContainer = new ContainerBuilder()
            .setAccentColor(0x57F287);

        supportContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('# 🆘 Getting Support\n*Need help? Here\'s how to get assistance*')
        );
        supportContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
        );

        supportContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 🔧 Technical Support')
        );

        supportContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('**SoizX Devs™ Server**\n• Join: `https://discord.gg/XkXSRrRE3P`\n• Get support in our Discord community\n• Report issues and get help from our team'),
            new TextDisplayBuilder().setContent('**Bot Creator - SUJIT**\n• Co-founder & Developer of SOIZX AI\n• Available in SoizX Devs™ server\n• Handles all bot-related issues and feature requests')
        );

        supportContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

        supportContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 📋 Before Requesting Support')
        );

        supportContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('1. **Check this help menu** for basic usage\n2. **Try the examples** provided in this guide\n3. **Include error messages** when reporting issues\n4. **Describe what you were trying to do** when the problem occurred')
        );

        supportContainer.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('help_back_to_main')
                    .setLabel('← Back to Help Menu')
                    .setStyle(ButtonStyle.Secondary)
            )
        );

        await interaction.update({
            components: [supportContainer],
            flags: MessageFlags.IsComponentsV2
        });
    } else if (interaction.customId === 'help_back_to_main') {
        await interaction.deferUpdate();
        const helpCommand = client.commands.get('help');
        if (helpCommand) {
            await helpCommand.execute(interaction, true);
        }
    } else if (interaction.customId === 'help_category_select') {
        const selectedValue = interaction.values[0];
        
        const categoryContainer = new ContainerBuilder()
            .setAccentColor(0x9B59B6);

        if (selectedValue === 'user_commands') {
            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('# 👤 User Commands\n*Commands available to all server members*')
            );
            categoryContainer.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## Profile Analysis')
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('**/whois [user]**\n**Purpose**: Get AI-powered analysis of any Discord user\n**Usage**: `/whois @username`\n**Example**: `/whois @JohnDoe`\n**Features**: Role analysis, activity summary, server participation insights')
            );

            categoryContainer.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## Conversation History')
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('**/history**\n**Purpose**: View your personal conversation history\n**Usage**: `/history`\n**Privacy**: Only you can see your own history\n**Contains**: Last 25 messages with timestamps and context'),
                new TextDisplayBuilder().setContent('**/clearhistory**\n**Purpose**: Delete all your conversation history\n**Usage**: `/clearhistory`\n**Warning**: ⚠️ This action cannot be undone\n**Effect**: Removes all stored messages and context data')
            );

        } else if (selectedValue === 'ai_features') {
            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('# 🧠 AI Features\n*Advanced artificial intelligence capabilities*')
            );
            categoryContainer.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## Text AI - Groq Integration')
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('**🤖 Llama3 Model**\n• Lightning-fast responses\n• Deep programming knowledge\n• General intelligence capabilities\n• Context-aware conversations'),
                new TextDisplayBuilder().setContent('**💬 Natural Conversations**\n• Ask coding questions directly\n• Get debugging assistance\n• Explain complex concepts\n• Programming best practices')
            );

            categoryContainer.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## Vision AI - Google Gemini')
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('**👁️ Image Analysis**\n• Read code from screenshots\n• Analyze system diagrams\n• Understand UI/UX mockups\n• Explain visual content'),
                new TextDisplayBuilder().setContent('**🔍 Usage**\n• Upload any image\n• Add optional text for context\n• Get detailed AI analysis\n• Perfect for debugging visual code issues')
            );

        } else if (selectedValue === 'channel_management') {
            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('# ⚙️ Channel Management\n*Control AI behavior in channels (Owner Only)*')
            );
            categoryContainer.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## Channel Controls')
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('**/enable**\n**Purpose**: Enable AI responses in current channel\n**Permission**: Bot owner only\n**Effect**: Bot will respond to mentions and process messages\n**Note**: DMs are always enabled'),
                new TextDisplayBuilder().setContent('**/disable**\n**Purpose**: Disable AI responses in current channel\n**Permission**: Bot owner only\n**Effect**: Bot ignores mentions and messages (except slash commands)\n**Use Case**: Reduce noise in busy channels')
            );

            categoryContainer.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## How It Works')
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('• **Enabled Channels**: Bot responds to @mentions and processes images\n• **Disabled Channels**: Slash commands still work, but no AI responses\n• **Direct Messages**: Always enabled regardless of channel settings\n• **Settings Persist**: Channel configurations are saved permanently')
            );

        } else if (selectedValue === 'bot_config') {
            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('# 🔧 Bot Configuration\n*Advanced settings and customization (Owner Only)*')
            );
            categoryContainer.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## System Prompts')
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('**/showsystemprompt**\n**Purpose**: Display current AI personality/behavior prompt\n**Permission**: Bot owner only\n**Shows**: The instructions that guide AI responses'),
                new TextDisplayBuilder().setContent('**/editsystemprompt**\n**Purpose**: Modify AI personality and behavior\n**Permission**: Bot owner only\n**Caution**: Changes affect all AI responses globally')
            );

            categoryContainer.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## Image Analysis Prompts')
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('**/showimageprompt**\n**Purpose**: Display current image analysis instructions\n**Permission**: Bot owner only\n**Shows**: How AI processes and analyzes uploaded images'),
                new TextDisplayBuilder().setContent('**/editimageprompt**\n**Purpose**: Customize image analysis behavior\n**Permission**: Bot owner only\n**Use**: Fine-tune how AI interprets visual content')
            );

            categoryContainer.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## User Management')
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('**/blacklistadd [user] [reason]**\n**Purpose**: Prevent a user from receiving AI responses\n**Permission**: Bot owner only\n**Effect**: User\'s messages will be silently ignored\n**Optional**: Reason for blacklisting'),
                new TextDisplayBuilder().setContent('**/blacklistremove [user]**\n**Purpose**: Remove a user from the blacklist\n**Permission**: Bot owner only\n**Effect**: User can interact with AI again'),
                new TextDisplayBuilder().setContent('**/blacklistlist**\n**Purpose**: View all blacklisted users\n**Permission**: Bot owner only\n**Shows**: Complete list with reasons and dates')
            );

        } else if (selectedValue === 'natural_language') {
            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('# 💬 Natural Language Features\n*Chat without commands - just talk naturally*')
            );
            categoryContainer.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## Conversation Modes')
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('**🏷️ Mention Mode**\n• Type @SoizX AI + your message\n• Works in any enabled channel\n• Best for public conversations'),
                new TextDisplayBuilder().setContent('**📩 Direct Messages**\n• Send DMs directly to the bot\n• No need to mention\n• Private one-on-one conversations'),
                new TextDisplayBuilder().setContent('**🖼️ Image Upload**\n• Upload images with or without text\n• Automatic AI analysis\n• Perfect for code screenshots')
            );

            categoryContainer.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## Special Recognition')
            );

            categoryContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('**👤 User Queries**\n• "who is @username"\n• "tell me about @user"\n• Natural language user analysis'),
                new TextDisplayBuilder().setContent('**🌤️ Weather Requests**\n• "weather in London"\n• "how\'s the weather in Tokyo?"\n• "is it raining in New York?"\n• Supports any city worldwide')
            );
        }

        categoryContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
        );

        categoryContainer.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('help_back_to_main')
                    .setLabel('← Back to Help Menu')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('help_examples')
                    .setLabel('📝 See Examples')
                    .setStyle(ButtonStyle.Primary)
            )
        );

        await interaction.update({
            components: [categoryContainer],
            flags: MessageFlags.IsComponentsV2
        });
    }
}

async function handleModalSubmit(interaction) {
    const { checkOwnerPermission } = require('./utils/permissions.js');
    
    if (!checkOwnerPermission(interaction.user.id)) {
        await interaction.reply({
            content: 'You do not have permission to use this feature.',
            ephemeral: true
        });
        return;
    }

    if (interaction.customId === 'editsystemprompt') {
        const newPrompt = interaction.fields.getTextInputValue('systemPromptInput');
        
        if (newPrompt.length > 2000) {
            await interaction.reply({
                content: 'System prompt is too long. Please keep it under 2000 characters.',
                ephemeral: true
            });
            return;
        }

        systemPrompt = newPrompt;
        const promptData = { prompt: newPrompt, imageAnalysisPrompt: imageAnalysisPrompt };
        fs.writeFileSync('./data/systemprompt.json', JSON.stringify(promptData, null, 2));

        await interaction.reply({
            content: `✅ System prompt has been updated successfully!\n\n**New prompt preview:**\n\`\`\`${newPrompt.substring(0, 500)}${newPrompt.length > 500 ? '...' : ''}\`\`\``,
            ephemeral: true
        });
    } else if (interaction.customId === 'editimageprompt') {
        const newPrompt = interaction.fields.getTextInputValue('imagePromptInput');
        
        if (newPrompt.length > 2000) {
            await interaction.reply({
                content: 'Image analysis prompt is too long. Please keep it under 2000 characters.',
                ephemeral: true
            });
            return;
        }

        imageAnalysisPrompt = newPrompt;
        const promptData = { prompt: systemPrompt, imageAnalysisPrompt: newPrompt };
        fs.writeFileSync('./data/systemprompt.json', JSON.stringify(promptData, null, 2));

        await interaction.reply({
            content: `✅ Image analysis prompt has been updated successfully!\n\n**New prompt preview:**\n\`\`\`${newPrompt.substring(0, 500)}${newPrompt.length > 500 ? '...' : ''}\`\`\``,
            ephemeral: true
        });
    }
}



client.on('messageCreate', async message => {
    if (message.author.bot) {
        return;
    }

    if (isUserBlacklisted(message.author.id)) {
        return;
    }

    if (message.content.startsWith('!')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();


        
        return;
    }

    const isMentioned = message.mentions.has(client.user);
    
    const isRoleMentioned = message.guild && message.mentions.roles.some(role => 
        message.guild.members.cache.get(client.user.id).roles.cache.has(role.id)
    );
    
    const isReplyToBot = message.reference && message.reference.messageId && 
        message.channel.messages.cache.get(message.reference.messageId)?.author.id === client.user.id;
    
    const isDM = message.channel.type === 1;
    
    const isChannelEnabled = message.guild ? enabledChannels[message.channel.id] : true;

    if (!isDM && !isMentioned && !isRoleMentioned && !isReplyToBot && !isChannelEnabled) {
        return;
    }

    try {
        if (isMentioned && message.content.trim() === `<@${client.user.id}>`) {
            
            const introContainer = new ContainerBuilder()
                .setAccentColor(0x000000)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# SoizX AI')
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`**Greetings,** <@${message.author.id}>`),
                            new TextDisplayBuilder().setContent('SoizX AI is a refined and intelligent presence—elegant, calm, and built to empower your server.\n\nIt listens when needed, acts with precision, and adds a layer of style to every interaction.\n\nFrom debugging to code analysis, it does it all—quietly, efficiently, and beautifully.')
                        )
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(client.user.displayAvatarURL({ size: 128 })))
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('Made By SoizX Development')
                );

            await message.reply({
                components: [introContainer],
                flags: MessageFlags.IsComponentsV2
            });
            return;
        }

        if (message.attachments.size > 0) {
            const imageAttachments = message.attachments.filter(attachment => 
                attachment.contentType && attachment.contentType.startsWith('image/')
            );
            
            if (imageAttachments.size > 0) {
                await message.channel.sendTyping();
                
                try {
                    for (const [index, attachment] of imageAttachments.entries()) {
                        let enhancedPrompt = imageAnalysisPrompt;
                        if (message.content.trim()) {
                            enhancedPrompt = `${imageAnalysisPrompt}\n\nUser's additional context/question: "${message.content.trim()}"`;
                        }
                        
                        if (imageAttachments.size > 1) {
                            enhancedPrompt += `\n\nNote: This is image ${index + 1} of ${imageAttachments.size} images sent together.`;
                        }
                        
                        const analysisPromise = analyzeImageWithGemini(attachment.url, enhancedPrompt);
                        const timeoutPromise = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Analysis timeout')), 30000)
                        );
                        
                        const imageAnalysis = await Promise.race([analysisPromise, timeoutPromise]);
                        
                        const userMessage = message.content.trim() ? 
                            `${message.content.trim()} [Image ${index + 1}/${imageAttachments.size} attached]` : 
                            `[Image ${index + 1}/${imageAttachments.size} attached]`;
                        await addMessageToHistory(message.author.id, message.channel.id, userMessage, 'user');
                        
                        await addMessageToHistory(message.author.id, message.channel.id, imageAnalysis, 'assistant');
                        
                        await sendImageAnalysisContainer(message, imageAnalysis);
                        
                        if (index < imageAttachments.size - 1) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                    return;
                } catch (error) {
                    console.error('Error analyzing image:', error);
                    let errorMessage = 'I encountered an error while analyzing the image.';
                    
                    if (error.message === 'Analysis timeout') {
                        errorMessage = 'Image analysis is taking longer than expected. Please try again with a smaller image.';
                    }
                    
                    await message.reply(errorMessage);
                    return;
                }
            }
        }

        if (!message.content.trim()) {
            return;
        }

        const whoIsMatch = message.content.match(/(?:who\s+is|who's)\s+<@!?(\d+)>/i);
        if (whoIsMatch) {
            const userId = whoIsMatch[1];
            const targetUser = message.guild.members.cache.get(userId);
            
            if (targetUser) {
                await message.channel.sendTyping();
                try {
                    // Special handling for Aegis (the creator)
                    if (userId === config.OWNER_IDS[0]) {
                        const aegisResponse = `🔧 **Meet Sujit - Head Mod & Bot Creator** 🔧

That's <@1455945908264108062>, the Founder of SoizX Development and the developer who specifically created me, SoizX AI!

🚀 **Sujit's Roles:**
• **Founder**: Leading staff member in SoizX Development
• **My Creator**: Built me (SoizX AI) from scratch
• **AI Integration Expert**: Implemented complex AI features and Discord integrations
• **Feature Developer**: Programmed my image analysis, conversation memory, and user profile features

You're talking to me right now because of Aegis's skills in creating advanced Discord bots with AI capabilities!

If you have suggestions for my features or need moderation help, Aegis is the Head Mod who made it all happen! 🎯`;
                        
                        await sendLongMessage(message, aegisResponse);
                        return;
                    }
                    
                    const userAnalysis = await generateUserAnalysis(targetUser, message.guild);
                    await sendLongMessage(message, userAnalysis);
                    return;
                } catch (error) {
                    console.error('Error generating user analysis:', error);
                    await message.reply('Sorry, I encountered an error while analyzing that user.');
                    return;
                }
            }
        }



        const weatherMatch = message.content.match(/(?:what(?:'s|\s+is)?\s+the\s+weather|weather\s+in|current\s+weather|how(?:'s|\s+is)\s+the\s+weather|weather\s+report|weather\s+forecast|temperature\s+in|how\s+hot\s+is\s+it|how\s+cold\s+is\s+it|is\s+it\s+raining|is\s+it\s+snowing|is\s+it\s+sunny|climate\s+in|atmospheric\s+conditions|meteorological\s+conditions|weather\s+conditions|weather\s+update|today(?:'s|\s+)?weather|weather\s+today|weather\s+right\s+now|current\s+temperature|temp\s+in|temperature\s+at|how\s+warm\s+is\s+it|weather\s+status|weather\s+info|weather\s+data|outside\s+temp|outside\s+weather|local\s+weather|weather\s+like|what\s+is\s+it\s+like\s+outside|check\s+weather|get\s+weather|tell\s+me\s+the\s+weather|show\s+me\s+the\s+weather|weather\s+please|need\s+weather|want\s+weather|gimme\s+weather|give\s+me\s+weather)\s+(?:in\s+|at\s+|for\s+|of\s+|from\s+)?(.+?)(?:\?|$|right\s+now|today|currently|now)/i);
        if (weatherMatch) {
            const location = weatherMatch[1].trim();
            await message.channel.sendTyping();
            
            try {
                const weatherData = await getWeatherData(location);
                
                const weatherResponse = `🌤️ **Current Weather in ${weatherData.location}**\n\n🌡️ **Temperature:** ${weatherData.temperature}°C (feels like ${weatherData.feels_like}°C)\n💧 **Humidity:** ${weatherData.humidity}%\n🌪️ **Wind:** ${weatherData.wind_speed} km/h\n☁️ **Conditions:** ${weatherData.weather_description}\n${weatherData.is_day ? '☀️ **Daytime**' : '🌙 **Nighttime**'}`;
                
                await sendLongMessage(message, weatherResponse);
                
                await addMessageToHistory(message.author.id, message.channel.id, message.content, 'user');
                await addMessageToHistory(message.author.id, message.channel.id, weatherResponse, 'assistant');
                
                return;
            } catch (error) {
                console.error('Error getting weather data:', error);
                await message.reply(`Sorry, I couldn't get the weather for "${location}". Please try a city name (e.g., "New York", "London", "Tokyo").`);
                return;
            }
        }

        await message.channel.sendTyping();

        await addMessageToHistory(message.author.id, message.channel.id, message.content, 'user');
        
        const channelHistory = await getChannelHistory(message.author.id, message.channel.id, 12);
        
        const responseText = await generateGroqResponse(message.content, systemPrompt, channelHistory);
        
        await addMessageToHistory(message.author.id, message.channel.id, responseText, 'assistant');

        if (responseText) {
            await sendLongMessage(message, responseText);
        }

    } catch (error) {
        console.error('Error processing message:', error);
        await message.reply('Sorry, I encountered an error while processing your message.');
    }
});

client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

module.exports = {
    client,
    enabledChannels,
    systemPrompt,
    imageAnalysisPrompt,
    updateSystemPrompt: (newPrompt) => {
        systemPrompt = newPrompt;
    },
    updateImageAnalysisPrompt: (newPrompt) => {
        imageAnalysisPrompt = newPrompt;
    },
    saveChannelsData: () => {
        fs.writeFileSync('./data/channels.json', JSON.stringify(enabledChannels, null, 2));
    },
    saveSystemPrompt: (prompt) => {
        const promptData = { prompt: prompt, imageAnalysisPrompt: imageAnalysisPrompt };
        fs.writeFileSync('./data/systemprompt.json', JSON.stringify(promptData, null, 2));
    },
    saveImageAnalysisPrompt: (prompt) => {
        const promptData = { prompt: systemPrompt, imageAnalysisPrompt: prompt };
        fs.writeFileSync('./data/systemprompt.json', JSON.stringify(promptData, null, 2));
    }
};

client.login(config.DISCORD_TOKEN);

/*
@Author: Sujit
Community: https://discord.gg/XkXSRrRE3P (SoizX Devs™)
Reach out for support or credits.
*/


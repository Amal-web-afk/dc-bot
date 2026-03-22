require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('./database');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

// Load Commands
const foldersPath = path.join(__dirname, 'commands');
if (!fs.existsSync(foldersPath)) fs.mkdirSync(foldersPath);

const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Load Events
const eventsPath = path.join(__dirname, 'events');
if (!fs.existsSync(eventsPath)) fs.mkdirSync(eventsPath);

const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// ==========================================
// Dashboard Express API
// ==========================================
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve the static website
app.use(express.static(path.join(__dirname, 'website')));

app.get('/api/guilds', (req, res) => {
    const guilds = client.guilds.cache.map(g => ({
        id: g.id,
        name: g.name,
        icon: g.iconURL()
    }));
    res.json(guilds);
});

app.get('/api/guild/:id/channels', (req, res) => {
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });
    const textChannels = guild.channels.cache
        .filter(c => c.isTextBased())
        .map(c => ({ id: c.id, name: c.name }));
    res.json(textChannels);
});

app.get('/api/guild/:id/roles', (req, res) => {
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).json({ error: "Guild not found" });

    const roles = guild.roles.cache
        .filter(r => r.id !== guild.id && !r.managed)
        .sort((a, b) => b.position - a.position)
        .map(r => ({ id: r.id, name: r.name, color: r.hexColor }));
    res.json(roles);
});

app.get('/api/commands', (req, res) => {
    const commandsList = client.commands.map(c => ({
        name: c.data.name,
        description: c.data.description
    }));
    res.json(commandsList);
});

app.get('/api/config/:id', async (req, res) => {
    const config = await db.getGuildConfig(req.params.id) || {};
    res.json(config);
});

app.post('/api/config/:id', async (req, res) => {
    const guildId = req.params.id;
    const payload = {
        guild_id: guildId,
        welcome_channel_id: req.body.welcome_channel_id || null,
        welcome_message: req.body.welcome_message || null,
        welcome_bg_url: req.body.welcome_bg_url || null,
        leave_channel_id: req.body.leave_channel_id || null,
        leave_message: req.body.leave_message || null,
        leave_bg_url: req.body.leave_bg_url || null,
        autorole_id: req.body.autorole_id || null,
        level_up_channel_id: req.body.level_up_channel_id || null,
        bot_commands_channel_id: req.body.bot_commands_channel_id || null,
        xp_logs_channel_id: req.body.xp_logs_channel_id || null
    };

    try {
        await db.setGuildConfig(payload);
        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/test/welcome/:id', async (req, res) => {
    const guildId = req.params.id;
    const { channel_id, message, bg_url } = req.body;
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) throw new Error("Guild not found");
        const channel = guild.channels.cache.get(channel_id);
        if (!channel) throw new Error("Please select a valid channel first.");

        const { createBanner } = require('./utils/canvasHelper');
        const { AttachmentBuilder } = require('discord.js');
        const buffer = await createBanner({
            type: 'WELCOME',
            username: client.user.username + " (Test)",
            memberCount: guild.memberCount,
            avatarUrl: client.user.displayAvatarURL({ extension: 'png', size: 256 }),
            backgroundUrl: bg_url
        });
        const attachment = new AttachmentBuilder(buffer, { name: 'test-welcome.png' });
        
        let msg = message || 'Welcome to {server}, {user}!';
        msg = msg.replace(/{user}/g, `<@${client.user.id}>`)
                 .replace(/{server}/g, guild.name)
                 .replace(/{memberCount}/g, guild.memberCount);
        
        await channel.send({ content: `**[TEST MODULE PREVIEW]**\n${msg}`, files: [attachment] });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/test/leave/:id', async (req, res) => {
    const guildId = req.params.id;
    const { channel_id, message, bg_url } = req.body;
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) throw new Error("Guild not found");
        const channel = guild.channels.cache.get(channel_id);
        if (!channel) throw new Error("Please select a valid channel first.");

        const { createBanner } = require('./utils/canvasHelper');
        const { AttachmentBuilder } = require('discord.js');
        const buffer = await createBanner({
            type: 'LEAVE',
            username: client.user.username + " (Test)",
            memberCount: guild.memberCount,
            avatarUrl: client.user.displayAvatarURL({ extension: 'png', size: 256 }),
            backgroundUrl: bg_url
        });
        const attachment = new AttachmentBuilder(buffer, { name: 'test-leave.png' });
        
        let msg = message || 'Goodbye {user}, we will miss you!';
        msg = msg.replace(/{user}/g, client.user.username)
                 .replace(/{server}/g, guild.name)
                 .replace(/{memberCount}/g, guild.memberCount);
        
        await channel.send({ content: `**[TEST MODULE PREVIEW]**\n${msg}`, files: [attachment] });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/setup/selfrole/:id', async (req, res) => {
    const guildId = req.params.id;
    const { channel_id, message, roles } = req.body;
    
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) throw new Error("Guild not found");
        
        const channel = guild.channels.cache.get(channel_id);
        if (!channel) throw new Error("Invalid channel");

        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const row = new ActionRowBuilder();

        for (const rData of roles) {
            if (!rData.role_id) continue;
            const role = guild.roles.cache.get(rData.role_id);
            if (!role) continue;

            const btn = new ButtonBuilder()
                .setCustomId(`selfrole_${role.id}`)
                .setLabel(role.name)
                .setStyle(ButtonStyle.Secondary);

            if (rData.emoji) {
                try {
                    btn.setEmoji(rData.emoji);
                } catch(e) {}
            }
            row.addComponents(btn);
        }

        if (row.components.length === 0) {
            throw new Error("No valid roles provided.");
        }

        await channel.send({ content: message || "Select your roles below:", components: [row] });
        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.listen(3000, () => {
    console.log('🌍 Web Dashboard running on http://localhost:3000');
});

client.login(process.env.DISCORD_TOKEN);

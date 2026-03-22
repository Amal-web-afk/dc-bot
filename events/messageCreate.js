const { Events } = require('discord.js');
const db = require('../database');

// In-memory cooldown map to prevent XP spamming
// Maps user_id -> last_message_timestamp
const cooldowns = new Map();

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore DMs and bot messages
        if (!message.guild || message.author.bot) return;

        const userId = message.author.id;
        const guildId = message.guild.id;

        // Apply a strict 1-second cooldown per user for XP gain
        const now = Date.now();
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + 1000;
            if (now < expirationTime) return; // User is on cooldown
        }

        // Update cooldown
        cooldowns.set(userId, now);

        // Grant 15 to 25 random XP
        const xpToAdd = Math.floor(Math.random() * 11) + 15;
        
        try {
            const result = await db.addXP(guildId, userId, xpToAdd);
            const config = await db.getGuildConfig(guildId) || {};

            // Admin XP Tracking Log
            if (config.xp_logs_channel_id) {
                const xpLogChannel = message.guild.channels.cache.get(config.xp_logs_channel_id);
                if (xpLogChannel) {
                    try {
                        xpLogChannel.send(`📈 **Chat XP Log:** <@${userId}> gained **${xpToAdd} XP** in <#${message.channel.id}>. (Total: **${result.newXp}**, Level: **${result.newLevel}**)`);
                    } catch(e) {}
                }
            }

            // Handle Level Up!
            if (result.leveledUp) {
                // Determine where to announce the level up
                const announceChannelId = config.level_up_channel_id;
                let announceChannel = message.channel;
                
                if (announceChannelId) {
                    const specificChannel = message.guild.channels.cache.get(announceChannelId);
                    if (specificChannel) announceChannel = specificChannel;
                }

                // Announce it
                try {
                    await announceChannel.send(`🎉 **Congratulations <@${userId}>**, you just advanced to **Level ${result.newLevel}**!`);
                } catch (e) {
                    console.error("Could not send level up message. Lacking permissions in channel?");
                }

                // Check and Assign Level Roles
                const levelRoles = await db.getLevelRoles(guildId);
                if (levelRoles && levelRoles.length > 0) {
                    const member = message.member;
                    if (member) {
                        for (const lr of levelRoles) {
                            // If they surpassed or met the required level and don't have the role yet
                            if (result.newLevel >= lr.level && !member.roles.cache.has(lr.role_id)) {
                                try {
                                    const role = message.guild.roles.cache.get(lr.role_id);
                                    if (role && message.guild.members.me.permissions.has('ManageRoles')) {
                                        await member.roles.add(role);
                                    }
                                } catch (e) {
                                    console.error("Failed to assign level role:", e);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error processing XP for message:", error);
        }
    },
};

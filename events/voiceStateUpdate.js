const { Events, EmbedBuilder } = require('discord.js');
const db = require('../database');

// Map of userId -> joinTimestamp
const voiceSessions = new Map();

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        if (!oldState.guild) return;
        if (oldState.member.user.bot) return;

        const userId = oldState.member.id;
        const guildId = oldState.guild.id;

        // User Joined a Voice Channel
        if (!oldState.channelId && newState.channelId) {
            voiceSessions.set(userId, Date.now());
            
            const config = await db.getGuildConfig(guildId) || {};
            const logChannelId = config.mod_logs_channel_id;
            if (logChannelId) {
                const logChannel = oldState.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('🔵 Voice Channel Joined')
                        .setColor('#3b82f6')
                        .setAuthor({ name: oldState.member.user.tag, iconURL: oldState.member.user.displayAvatarURL() })
                        .setDescription(`<@${userId}> joined the voice channel **${newState.channel.name}**`)
                        .setTimestamp();
                    try { logChannel.send({ embeds: [embed] }); } catch(e) {}
                }
            }
        } 
        // User Left a Voice Channel
        else if (oldState.channelId && !newState.channelId) {
            if (voiceSessions.has(userId)) {
                const joinTime = voiceSessions.get(userId);
                const durationMs = Date.now() - joinTime;
                const durationSeconds = Math.floor(durationMs / 1000);
                
                voiceSessions.delete(userId);

                // Mod Logs execution
                const config = await db.getGuildConfig(guildId) || {};
                const logChannelId = config.mod_logs_channel_id;
                if (logChannelId) {
                    const logChannel = oldState.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('⚫ Voice Channel Left')
                            .setColor('#71717a')
                            .setAuthor({ name: oldState.member.user.tag, iconURL: oldState.member.user.displayAvatarURL() })
                            .setDescription(`<@${userId}> left the voice channel **${oldState.channel.name}** after ${durationSeconds} seconds.`)
                            .setTimestamp();
                        try { logChannel.send({ embeds: [embed] }); } catch(e) {}
                    }
                }

                if (durationSeconds > 0) {
                    // Give 1 XP per second
                    const xpToAdd = durationSeconds * 1;
                    
                    try {
                        const result = await db.addXP(guildId, userId, xpToAdd);
                        const config = await db.getGuildConfig(guildId) || {};
                        
                        // Admin Voice XP Tracking Log
                        if (config.xp_logs_channel_id) {
                            const xpLogChannel = oldState.guild.channels.cache.get(config.xp_logs_channel_id);
                            if (xpLogChannel) {
                                try {
                                    xpLogChannel.send(`📈 **Voice XP Log:** <@${userId}> gained **${xpToAdd} XP** in Voice Channel **${oldState.channel.name}**. (Total: **${result.newXp}**, Level: **${result.newLevel}**)`);
                                } catch(e) {}
                            }
                        }

                        if (result.leveledUp) {
                            const announceChannelId = config.level_up_channel_id;
                            
                            // Since it's a voice leave event, there is no text channel context.
                            // Default to the specific level_up_channel_id, or the server's systemChannel.
                            let announceChannel = null;
                            if (announceChannelId) {
                                announceChannel = oldState.guild.channels.cache.get(announceChannelId);
                            } else if (oldState.guild.systemChannel) {
                                announceChannel = oldState.guild.systemChannel;
                            }

                            if (announceChannel) {
                                try {
                                    await announceChannel.send(`🎙️ **Congratulations <@${userId}>**, you just advanced to **Level ${result.newLevel}** after spending time in Voice!`);
                                } catch(e) {}
                            }

                            // Evaluate Role assignments
                            const levelRoles = await db.getLevelRoles(guildId);
                            if (levelRoles && levelRoles.length > 0) {
                                const member = oldState.member;
                                for (const lr of levelRoles) {
                                    if (result.newLevel >= lr.level && !member.roles.cache.has(lr.role_id)) {
                                        const role = oldState.guild.roles.cache.get(lr.role_id);
                                        if (role && oldState.guild.members.me.permissions.has('ManageRoles')) {
                                            try { await member.roles.add(role); } catch(ex) {}
                                        }
                                    }
                                }
                            }
                        }
                    } catch(e) { 
                        console.error('Voice XP tracking internal error:', e); 
                    }
                }
            }
        }
    }
};

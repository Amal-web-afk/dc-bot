const { Events, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const { createBanner } = require('../utils/canvasHelper');

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member, client) {
		const config = await db.getGuildConfig(member.guild.id);
		if (!config) return;

        // Give Autorole
        if (config.autorole_id) {
            try {
                const role = member.guild.roles.cache.get(config.autorole_id);
                if (role && member.guild.members.me.permissions.has('ManageRoles')) {
                    await member.roles.add(role);
                }
            } catch(e) {
                console.error("Failed to give autorole:", e);
            }
        }

		const channelId = config.welcome_channel_id;
		if (!channelId) return;

		const channel = member.guild.channels.cache.get(channelId);
		if (!channel) return;

		try {
            const memberCount = member.guild.memberCount;
            // Generate the image buffer
            const buffer = await createBanner({
                type: 'WELCOME',
                username: member.user.username,
                memberCount: memberCount,
                avatarUrl: member.user.displayAvatarURL({ extension: 'png', size: 256 }),
                backgroundUrl: config.welcome_bg_url
            });

            const attachment = new AttachmentBuilder(buffer, { name: 'welcome-image.png' });

            // Format message
            let welcomeMsg = config.welcome_message || 'Welcome to {server}, {user}!';
            welcomeMsg = welcomeMsg
                            .replace(/{user}/g, `<@${member.id}>`)
                            .replace(/{server}/g, member.guild.name)
                            .replace(/{memberCount}/g, memberCount);

            await channel.send({ content: welcomeMsg, files: [attachment] });
        } catch (error) {
            console.error('Error in guildMemberAdd:', error);
        }

        // --- Mod Logs ---
        if (config.mod_logs_channel_id) {
            const logChannel = member.guild.channels.cache.get(config.mod_logs_channel_id);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🟢 Member Joined')
                    .setColor('#22c55e')
                    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                    .setDescription(`<@${member.user.id}> joined the server!`)
                    .setFooter({ text: `Account Created: ${member.user.createdAt.toDateString()}` })
                    .setTimestamp();

                try { logChannel.send({ embeds: [embed] }); } catch(e) {}
            }
        }
	},
};

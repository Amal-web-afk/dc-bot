const { Events, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const { createBanner } = require('../utils/canvasHelper');

module.exports = {
	name: Events.GuildMemberRemove,
	async execute(member, client) {
		const config = await db.getGuildConfig(member.guild.id);
		
		if (!config || !config.leave_channel_id) return;

		const channel = member.guild.channels.cache.get(config.leave_channel_id);
		if (!channel) return;

		try {
            const memberCount = member.guild.memberCount;
            // Generate the image buffer
            const buffer = await createBanner({
                type: 'LEAVE',
                username: member.user.username,
                memberCount: memberCount,
                avatarUrl: member.user.displayAvatarURL({ extension: 'png', size: 256 }),
                backgroundUrl: config.leave_bg_url
            });

            const attachment = new AttachmentBuilder(buffer, { name: 'leave-image.png' });

            // Format message
            let leaveMsg = config.leave_message || 'Goodbye {user}, we will miss you!';
            leaveMsg = leaveMsg
                            .replace(/{user}/g, member.user.username)
                            .replace(/{server}/g, member.guild.name)
                            .replace(/{memberCount}/g, memberCount);

            await channel.send({ content: leaveMsg, files: [attachment] });
        } catch (error) {
            console.error('Error in guildMemberRemove:', error);
        }

        // --- Mod Logs ---
        if (config.mod_logs_channel_id) {
            const logChannel = member.guild.channels.cache.get(config.mod_logs_channel_id);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🔴 Member Left')
                    .setColor('#ef4444')
                    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                    .setDescription(`<@${member.user.id}> left the server.`)
                    .setFooter({ text: `User ID: ${member.user.id}` })
                    .setTimestamp();

                try { logChannel.send({ embeds: [embed] }); } catch(e) {}
            }
        }
	},
};

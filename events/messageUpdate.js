const { Events, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        if (!oldMessage.guild || oldMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return; // Ignore embed payload updates

        const config = await db.getGuildConfig(oldMessage.guild.id) || {};
        const logChannelId = config.mod_logs_channel_id;
        if (!logChannelId) return;

        const logChannel = oldMessage.guild.channels.cache.get(logChannelId);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle('🟠 Message Edited')
            .setColor('#f97316')
            .setAuthor({ name: oldMessage.author.tag, iconURL: oldMessage.author.displayAvatarURL() })
            .setDescription(`**Message edited in <#${oldMessage.channel.id}>** [Jump to Message](${newMessage.url})`)
            .addFields(
                { name: 'Before', value: oldMessage.content || '[Blank prior]' },
                { name: 'After', value: newMessage.content || '[Blank after]' }
            )
            .setFooter({ text: `User ID: ${oldMessage.author.id}` })
            .setTimestamp();

        try { await logChannel.send({ embeds: [embed] }); } catch(e) {}
    }
};

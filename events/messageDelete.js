const { Events, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        if (!message.guild || message.author?.bot) return;

        const config = await db.getGuildConfig(message.guild.id) || {};
        const logChannelId = config.mod_logs_channel_id;
        if (!logChannelId) return;

        const logChannel = message.guild.channels.cache.get(logChannelId);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle('🔴 Message Deleted')
            .setColor('#ef4444')
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setDescription(`**Message sent by <@${message.author.id}> deleted in <#${message.channel.id}>**\n\n${message.content || '[Embed/Image content deleted]'}`)
            .setFooter({ text: `User ID: ${message.author.id}` })
            .setTimestamp();

        try { await logChannel.send({ embeds: [embed] }); } catch(e) {}
    }
};

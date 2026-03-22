const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup-leave')
		.setDescription('Set up the leave message and banner for this server.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addChannelOption(option => 
			option.setName('channel')
				.setDescription('The channel to send leave messages in')
				.setRequired(true))
		.addStringOption(option => 
			option.setName('background')
				.setDescription('URL for the background image of the banner (jpg, png)')
				.setRequired(false))
		.addStringOption(option => 
			option.setName('message')
				.setDescription('Custom leave message (use {user} for name)')
				.setRequired(false)),

	async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ You strictly require `Administrator` permissions to use this command!', ephemeral: true });
        }

		const channel = interaction.options.getChannel('channel');
		const background = interaction.options.getString('background') || 'https://images.unsplash.com/photo-1493606371202-6275828f90f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1024&q=80';
		const message = interaction.options.getString('message') || 'Goodbye {user}, we will miss you!';

        try {
		    await db.setGuildConfig({
                guild_id: interaction.guildId,
                leave_channel_id: channel.id,
                leave_message: message,
                leave_bg_url: background
            });
            await interaction.reply({ content: `Leave system configured! \nChannel: <#${channel.id}>\nMessage: \`${message}\``, ephemeral: true });
        } catch (e) {
            console.error(e);
            await interaction.reply({ content: `Failed to save setup config!`, ephemeral: true });
        }
	},
};

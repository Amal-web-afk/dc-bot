const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup-welcome')
		.setDescription('Set up the welcome message and banner for this server.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addChannelOption(option => 
			option.setName('channel')
				.setDescription('The channel to send welcome messages in')
				.setRequired(true))
		.addStringOption(option => 
			option.setName('background')
				.setDescription('URL for the background image of the banner (jpg, png)')
				.setRequired(false))
		.addStringOption(option => 
			option.setName('message')
				.setDescription('Custom welcome message (use {user} for mention or {server} for server name)')
				.setRequired(false)),

	async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ You strictly require `Administrator` permissions to use this command!', ephemeral: true });
        }
        
		const channel = interaction.options.getChannel('channel');
		const background = interaction.options.getString('background') || 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-1.2.1&auto=format&fit=crop&w=1024&q=80';
		const message = interaction.options.getString('message') || 'Welcome to {server}, {user}!';

        try {
		    await db.setGuildConfig({
                guild_id: interaction.guildId,
                welcome_channel_id: channel.id,
                welcome_message: message,
                welcome_bg_url: background
            });
            await interaction.reply({ content: `Welcome system configured! \nChannel: <#${channel.id}>\nMessage: \`${message}\``, ephemeral: true });
        } catch (e) {
            console.error(e);
            await interaction.reply({ content: `Failed to save setup config!`, ephemeral: true });
        }
	},
};

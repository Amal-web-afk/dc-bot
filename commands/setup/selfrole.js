const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup-selfrole')
		.setDescription('Sends an interactive self-role panel with beautiful emoji buttons.')
        .addChannelOption(option => option.setName('channel').setDescription('The channel to send the panel to').setRequired(true))
        .addStringOption(option => option.setName('message').setDescription('The message to display above the buttons').setRequired(true))
        .addRoleOption(option => option.setName('role1').setDescription('First role').setRequired(true))
        .addStringOption(option => option.setName('emoji1').setDescription('Emoji for First role (Custom Emoji or Unicode)').setRequired(false))
        .addRoleOption(option => option.setName('role2').setDescription('Second role').setRequired(false))
        .addStringOption(option => option.setName('emoji2').setDescription('Emoji for Second role').setRequired(false))
        .addRoleOption(option => option.setName('role3').setDescription('Third role').setRequired(false))
        .addStringOption(option => option.setName('emoji3').setDescription('Emoji for Third role').setRequired(false))
        .addRoleOption(option => option.setName('role4').setDescription('Fourth role').setRequired(false))
        .addStringOption(option => option.setName('emoji4').setDescription('Emoji for Fourth role').setRequired(false))
        .addRoleOption(option => option.setName('role5').setDescription('Fifth role').setRequired(false))
        .addStringOption(option => option.setName('emoji5').setDescription('Emoji for Fifth role').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
	async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ content: '❌ You strictly require `Manage Roles` permissions to use this command!', ephemeral: true });
        }

		const channel = interaction.options.getChannel('channel');
        const messageText = interaction.options.getString('message');
        
        const roleData = [
            { role: interaction.options.getRole('role1'), emoji: interaction.options.getString('emoji1') },
            { role: interaction.options.getRole('role2'), emoji: interaction.options.getString('emoji2') },
            { role: interaction.options.getRole('role3'), emoji: interaction.options.getString('emoji3') },
            { role: interaction.options.getRole('role4'), emoji: interaction.options.getString('emoji4') },
            { role: interaction.options.getRole('role5'), emoji: interaction.options.getString('emoji5') }
        ].filter(r => r.role != null);

        const row = new ActionRowBuilder();

        for (const data of roleData) {
            const btn = new ButtonBuilder()
                .setCustomId(`selfrole_${data.role.id}`)
                .setLabel(data.role.name)
                .setStyle(ButtonStyle.Secondary);
            
            // If they provided a custom emoji like <:name:123456789> or a standard emoji
            if (data.emoji) {
                try {
                    btn.setEmoji(data.emoji);
                } catch(e) {
                    console.error("Invalid emoji format provided:", data.emoji);
                }
            }

            row.addComponents(btn);
        }

        try {
            await channel.send({ content: messageText, components: [row] });
            await interaction.reply({ content: `✅ Self-role panel expertly dispatched to ${channel} with your custom emojis!`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Failed to send self-role panel. Please ensure I have permissions to view and send messages in that channel.', ephemeral: true });
        }
	},
};

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Bans a member from the server.')
        .addUserOption(option => option.setName('target').setDescription('The member to ban').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for banning'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		const targetUser = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
        if (member && !member.bannable) {
            return interaction.reply({ content: 'I do not have permissions to ban this user!', ephemeral: true });
        }
        
        try {
            await interaction.guild.members.ban(targetUser, { reason });
            await interaction.reply({ content: `Successfully banned **${targetUser.tag}**. Reason: ${reason}` });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error trying to ban the user.', ephemeral: true });
        }
	},
};

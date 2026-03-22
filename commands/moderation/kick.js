const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kicks a member from the server.')
        .addUserOption(option => option.setName('target').setDescription('The member to kick').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for kicking'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
	async execute(interaction) {
		const targetUser = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(targetUser.id);
        
        if (!member) {
            return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
        }
        
        if (!member.kickable) {
            return interaction.reply({ content: 'I do not have permissions to kick this user!', ephemeral: true });
        }
        
        try {
            await member.kick(reason);
            await interaction.reply({ content: `Successfully kicked **${targetUser.tag}**. Reason: ${reason}` });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error trying to kick the user.', ephemeral: true });
        }
	},
};

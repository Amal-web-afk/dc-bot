const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Get information about a user or the server.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Info about a user')
                .addUserOption(option => option.setName('target').setDescription('The user')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Info about the server')),
                
	async execute(interaction) {
		if (interaction.options.getSubcommand() === 'user') {
			const user = interaction.options.getUser('target') || interaction.user;
            const member = await interaction.guild.members.fetch(user.id);
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${user.username}'s Information`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Joined Discord', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true }
                )
                .setFooter({ text: `ID: ${user.id}` });

			await interaction.reply({ embeds: [embed] });
		} else if (interaction.options.getSubcommand() === 'server') {
            const { guild } = interaction;
            const owner = await guild.fetchOwner();

            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle(`${guild.name} Information`)
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: 'Owner', value: owner.user.tag, inline: true },
                    { name: 'Members', value: `${guild.memberCount}`, inline: true },
                    { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
                )
                .setFooter({ text: `Server ID: ${guild.id}` });
                
			await interaction.reply({ embeds: [embed] });
		}
	},
};

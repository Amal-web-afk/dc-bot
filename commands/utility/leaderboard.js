const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Displays the top 10 most active members on the server'),
	async execute(interaction) {
		const top = await db.getLeaderboard(interaction.guildId, 10);
        
        if (!top || top.length === 0) {
            return interaction.reply({ content: 'Nobody has spoken yet! The leaderboard is completely empty.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🏆 Server Leaderboard | ${interaction.guild.name}`)
            .setColor('#facc15')
            .setTimestamp();

        let desc = '';
        top.forEach((userRecord, index) => {
            let emoji = '🏅';
            if (index === 0) emoji = '🥇';
            if (index === 1) emoji = '🥈';
            if (index === 2) emoji = '🥉';

            desc += `${emoji} **#${index + 1}** <@${userRecord.user_id}>\n`;
            desc += `└ **Level ${userRecord.level}** • ${userRecord.xp} XP\n\n`;
        });

        embed.setDescription(desc);

        await interaction.reply({ embeds: [embed] });
	},
};

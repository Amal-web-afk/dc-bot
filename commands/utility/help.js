const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('List all available commands.'),
	async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle('🤖 Bot Commands Help')
            .setDescription('Here is a list of my commands. To set up welcome/leave banners, use the setup commands.')
            .addFields(
                { name: '🛠️ Setup (Admins Only)', value: '`/setup-welcome` - Configure welcome channel/banner\n`/setup-leave` - Configure leave channel/banner' },
                { name: '⚙️ Utility', value: '`/ping` - Check bot latency\n`/info user` - Get user info\n`/info server` - Get server info\n`/help` - Show this list' }
            )
            .setFooter({ text: 'Enjoy the features!' })
            .setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setlevel')
		.setDescription('Administrator Only: Overwrites a users level in the system.')
        .addUserOption(option => option.setName('user').setDescription('The target user').setRequired(true))
        .addIntegerOption(option => option.setName('level').setDescription('The exact level to assign').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
        
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.editReply('❌ You must be an Administrator to run this command.');
        }

        const targetUser = interaction.options.getUser('user');
        const level = interaction.options.getInteger('level');
        const guildId = interaction.guildId;

        if (level < 0) return interaction.editReply('❌ Level cannot be less than 0.');

        const exactXp = 100 * Math.pow(level, 2);
        
        try {
            await db.UserLevel.findOneAndUpdate(
                { guild_id: guildId, user_id: targetUser.id },
                { xp: exactXp, level: level },
                { upsert: true }
            );

            await interaction.editReply(`✅ Master Override executed. Strongly bound <@${targetUser.id}> to **Level ${level}** (${exactXp} XP). Note: Role assignments are currently not backfilled when skipping levels manually.`);
        } catch(e) {
            console.error(e);
            await interaction.editReply('❌ Database manipulation failed due to an extreme internal exception.');
        }
	},
};

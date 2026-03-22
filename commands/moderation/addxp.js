const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addxp')
		.setDescription('Administrator Only: Grants specific quantity of XP to a user.')
        .addUserOption(option => option.setName('user').setDescription('The user to target').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('Amount of raw XP to explicitly grant.').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
        
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.editReply('❌ You must be an Administrator to run this command.');
        }

        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const guildId = interaction.guildId;

        try {
            const result = await db.addXP(guildId, targetUser.id, amount);
            await interaction.editReply(`✅ Successfully pumped **${amount} XP** directly into <@${targetUser.id}>!\nThey are officially tracked at Level ${result.newLevel}.`);
        } catch(e) {
            console.error(e);
            await interaction.editReply('❌ Database operation failed.');
        }
	},
};

const { Events, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction, client) {
		if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            // Global Command Restriction logic
            if (interaction.guildId) {
                const config = await db.getGuildConfig(interaction.guildId) || {};
                const whitelistChannel = config.bot_commands_channel_id;
                
                // Which commands are restricted to the bot channel? (Utility commands meant for all users)
                const utilityCommands = ['rank', 'leaderboard', 'ping', 'help']; 

                if (whitelistChannel && utilityCommands.includes(interaction.commandName)) {
                    // Non-admins must use the specific channel
                    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && interaction.channelId !== whitelistChannel) {
                        return interaction.reply({ content: `🚫 This command is locked. Please send command requests over in <#${whitelistChannel}>!`, ephemeral: true });
                    }
                }
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        } else if (interaction.isButton()) {
            // Self-Role Handling
            if (interaction.customId.startsWith('selfrole_')) {
                const roleId = interaction.customId.replace('selfrole_', '');
                const role = interaction.guild.roles.cache.get(roleId);
                
                if (!role) {
                    return interaction.reply({ content: '❌ This role no longer exists in the server.', ephemeral: true });
                }

                const member = interaction.member;
                
                try {
                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(roleId);
                        await interaction.reply({ content: `➖ I have removed the **${role.name}** role from you.`, ephemeral: true });
                    } else {
                        await member.roles.add(roleId);
                        await interaction.reply({ content: `➕ I have granted you the **${role.name}** role!`, ephemeral: true });
                    }
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: '❌ I do not have permission to manage this role. My bot role must be placed higher than this role in the server settings!', ephemeral: true });
                }
            }
        }
	},
};

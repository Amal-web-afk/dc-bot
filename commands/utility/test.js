const { SlashCommandBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');
const { createBanner } = require('../../utils/canvasHelper');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('Tests the welcome and leave banners configured for the server.')
        .addStringOption(option => 
            option.setName('module')
            .setDescription('Which module to test')
            .setRequired(true)
            .addChoices(
                { name: 'Welcome Message', value: 'welcome' },
                { name: 'Leave Message', value: 'leave' },
                { name: 'Both (Welcome & Leave)', value: 'both' }
            ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: '❌ You strictly require `Manage Server` permissions to use this command!', ephemeral: true });
        }

		await interaction.deferReply({ ephemeral: true });
        
        try {
            const config = await db.getGuildConfig(interaction.guildId) || {};
            const moduleToTest = interaction.options.getString('module');
            
            let sentChannels = [];

            // 1. Welcome Test
            if (moduleToTest === 'welcome' || moduleToTest === 'both') {
                if (!config.welcome_channel_id) {
                    return interaction.editReply('❌ No Welcome channel is configured in the Dashboard!');
                }
                const welcomeChannel = interaction.guild.channels.cache.get(config.welcome_channel_id);
                if (!welcomeChannel) {
                    return interaction.editReply('❌ The configured Welcome channel cannot be found. Please update it in the Dashboard.');
                }

                const welcomeBuffer = await createBanner({
                    type: 'WELCOME',
                    username: interaction.user.username + " (Test)",
                    memberCount: interaction.guild.memberCount,
                    avatarUrl: interaction.user.displayAvatarURL({ extension: 'png', size: 256 }),
                    backgroundUrl: config.welcome_bg_url
                });
                const welcomeAttachment = new AttachmentBuilder(welcomeBuffer, { name: 'test-welcome.png' });
                
                let welcomeMsg = config.welcome_message || 'Welcome to {server}, {user}!';
                welcomeMsg = welcomeMsg.replace(/{user}/g, `<@${interaction.user.id}>`)
                                       .replace(/{server}/g, interaction.guild.name)
                                       .replace(/{memberCount}/g, interaction.guild.memberCount);

                await welcomeChannel.send({ 
                    content: `**[TEST MODULE PREVIEW]**\n${welcomeMsg}`, 
                    files: [welcomeAttachment] 
                });
                sentChannels.push(`<#${welcomeChannel.id}>`);
            }
            
            // 2. Leave Test
            if (moduleToTest === 'leave' || moduleToTest === 'both') {
                if (!config.leave_channel_id) {
                    return interaction.editReply('❌ No Leave channel is configured in the Dashboard!');
                }
                const leaveChannel = interaction.guild.channels.cache.get(config.leave_channel_id);
                if (!leaveChannel) {
                    return interaction.editReply('❌ The configured Leave channel cannot be found.');
                }

                const leaveBuffer = await createBanner({
                    type: 'LEAVE',
                    username: interaction.user.username + " (Test)",
                    memberCount: interaction.guild.memberCount,
                    avatarUrl: interaction.user.displayAvatarURL({ extension: 'png', size: 256 }),
                    backgroundUrl: config.leave_bg_url
                });
                const leaveAttachment = new AttachmentBuilder(leaveBuffer, { name: 'test-leave.png' });
                
                let leaveMsg = config.leave_message || 'Goodbye {user}, we will miss you!';
                leaveMsg = leaveMsg.replace(/{user}/g, interaction.user.username)
                                   .replace(/{server}/g, interaction.guild.name)
                                   .replace(/{memberCount}/g, interaction.guild.memberCount);

                await leaveChannel.send({ 
                    content: `**[TEST MODULE PREVIEW]**\n${leaveMsg}`, 
                    files: [leaveAttachment] 
                });
                sentChannels.push(`<#${leaveChannel.id}>`);
            }
            
            if (sentChannels.length > 0) {
                await interaction.editReply({ 
                    content: `✅ The test message(s) were successfully dispatched to: ${sentChannels.join(' and ')}` 
                });
            }
            
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Failed to generate or send test banners.' });
        }
	},
};

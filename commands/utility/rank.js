const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const db = require('../../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rank')
		.setDescription('Display your current server Rank and XP')
        .addUserOption(option => option.setName('user').setDescription('The user to check the rank of').setRequired(false)),
	async execute(interaction) {
		await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const guildId = interaction.guildId;

        const rankData = await db.getRank(guildId, targetUser.id);
        const xp = rankData.xp;
        const level = rankData.level;
        const rank = rankData.rank;
        
        // Next level XP
        const nextLevelXp = 100 * Math.pow(level + 1, 2);
        const prevLevelXp = level === 0 ? 0 : 100 * Math.pow(level, 2);
        
        const xpIntoLevel = xp - prevLevelXp;
        const xpRequiredForLevel = nextLevelXp - prevLevelXp;
        const progress = Math.min(xpIntoLevel / xpRequiredForLevel, 1);

        // Canvas magic
        const canvas = createCanvas(800, 250);
        const ctx = canvas.getContext('2d');

        // Draw background
        ctx.fillStyle = '#1e1e24';
        ctx.beginPath();
        ctx.roundRect(0, 0, canvas.width, canvas.height, 20);
        ctx.fill();
        ctx.clip();

        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw avatar
        const avatarSize = 150;
        const avatarX = 50;
        const avatarY = 50;

        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.save();
        ctx.clip();
        
        try {
            const avatar = await loadImage(targetUser.displayAvatarURL({ extension: 'png', size: 256 }));
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        } catch(e) {}
        ctx.restore();

        // Draw Username
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px "Segoe UI", sans-serif';
        ctx.fillText(targetUser.username, 230, 90);

        // Draw Level & Rank text
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 45px "Segoe UI", sans-serif';
        ctx.fillText(`LEVEL ${level}`, 230, 150);
        
        ctx.fillStyle = '#a1a1aa';
        ctx.font = 'bold 30px "Segoe UI", sans-serif';
        let rankStr = rank === 0 ? 'Unranked' : `#${rank}`;
        ctx.fillText(`RANK ${rankStr}`, 600, 90);

        // Draw Progress Bar Background
        const barX = 230;
        const barY = 180;
        const barWidth = 500;
        const barHeight = 25;

        ctx.fillStyle = '#3f3f46';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 15);
        ctx.fill();

        // Draw Progress Bar Fill
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.roundRect(barX, barY, Math.max(barWidth * progress, 15), barHeight, 15);
        ctx.fill();

        // Draw XP Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px "Segoe UI", sans-serif';
        const text = `${xp} / ${nextLevelXp} XP`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillText(text, barX + (barWidth / 2) - (textWidth / 2), barY - 10);

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'rank-card.png' });
        await interaction.editReply({ files: [attachment] });
	},
};

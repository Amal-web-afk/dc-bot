const { createCanvas, loadImage } = require('canvas');

async function createBanner(bannerData) {
    const { 
        type = 'WELCOME', // 'WELCOME' or 'LEAVE'
        username, 
        memberCount, 
        avatarUrl, 
        backgroundUrl,
        message = ''
    } = bannerData;

    // Define banner dimensions
    const width = 1024;
    const height = 450;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Draw Background
    try {
        const bg = await loadImage(backgroundUrl);
        ctx.drawImage(bg, 0, 0, width, height);
    } catch (err) {
        // Fallback to a solid color if image fails to load
        ctx.fillStyle = '#23272A'; // Discord dark gray
        ctx.fillRect(0, 0, width, height);
    }

    // 2. Add an overlay to make text more readable
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, height);

    // 3. Draw Avatar (circular clipping)
    const avatarSize = 200;
    const avatarX = width / 2;
    const avatarY = height / 2 - 50;
    
    // Avatar border
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2 + 10, 0, Math.PI * 2, true);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.closePath();

    try {
        const avatar = await loadImage(avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png');
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
        ctx.restore();
    } catch (err) {
        console.error("Error loading avatar:", err);
    }

    // 4. Draw Text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    // Main Title Text
    ctx.font = 'bold 50px sans-serif';
    const mainText = type === 'WELCOME' ? 'WELCOME TO THE SERVER' : 'GOODBYE';
    ctx.fillText(mainText, width / 2, avatarY + avatarSize / 2 + 60);

    // Sub Title Text (username)
    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = type === 'WELCOME' ? '#4ade80' : '#f87171'; // Green for welcome, Red for leave
    ctx.fillText(username, width / 2, avatarY + avatarSize / 2 + 110);

    // Member count text
    if (memberCount) {
        ctx.fillStyle = '#d1d5db';
        ctx.font = '30px sans-serif';
        const memberText = type === 'WELCOME' 
            ? `You are our #${memberCount} member`
            : `We are now ${memberCount} members`;
        ctx.fillText(memberText, width / 2, avatarY + avatarSize / 2 + 160);
    }

    return canvas.toBuffer();
}

module.exports = {
    createBanner
};

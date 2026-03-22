const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Play Rock, Paper, Scissors with the bot!'),
    async execute(interaction) {
        const rock = new ButtonBuilder()
            .setCustomId('rock')
            .setLabel('Rock')
            .setEmoji('🪨')
            .setStyle(ButtonStyle.Primary);

        const paper = new ButtonBuilder()
            .setCustomId('paper')
            .setLabel('Paper')
            .setEmoji('📄')
            .setStyle(ButtonStyle.Primary);

        const scissors = new ButtonBuilder()
            .setCustomId('scissors')
            .setLabel('Scissors')
            .setEmoji('✂️')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder()
            .addComponents(rock, paper, scissors);

        const response = await interaction.reply({
            content: 'Choose Rock, Paper, or Scissors!',
            components: [row]
        });

        try {
            const confirmation = await response.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 30000 });
            
            const choices = ['rock', 'paper', 'scissors'];
            const botChoice = choices[Math.floor(Math.random() * choices.length)];
            const userChoice = confirmation.customId;

            let result = '';
            if (userChoice === botChoice) {
                result = "It's a tie!";
            } else if (
                (userChoice === 'rock' && botChoice === 'scissors') ||
                (userChoice === 'paper' && botChoice === 'rock') ||
                (userChoice === 'scissors' && botChoice === 'paper')
            ) {
                result = "You win!";
            } else {
                result = "I win!";
            }

            const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
            await confirmation.update({
                content: `You chose ${emojis[userChoice]}\nI chose ${emojis[botChoice]}\n**${result}**`,
                components: []
            });
        } catch (e) {
            await interaction.editReply({ content: 'You took too long to choose!', components: [] });
        }
    },
};

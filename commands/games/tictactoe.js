const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Play Tic-Tac-Toe with someone!')
        .addUserOption(option => 
            option.setName('opponent')
                .setDescription('The user you want to play against')
                .setRequired(true)),
    async execute(interaction) {
        const opponent = interaction.options.getUser('opponent');
        if (opponent.bot) {
            return interaction.reply({ content: "You can't play against a bot!", ephemeral: true });
        }
        if (opponent.id === interaction.user.id) {
            return interaction.reply({ content: "You can't play against yourself!", ephemeral: true });
        }

        let board = Array(9).fill(null);
        let currentPlayer = interaction.user;
        let p1 = interaction.user;
        let p2 = opponent;
        
        function checkWin() {
            const winConditions = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ];
            for (let condition of winConditions) {
                const [a, b, c] = condition;
                if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                    return board[a]; 
                }
            }
            if (!board.includes(null)) return 'draw';
            return null;
        }

        function createGrid(disabled = false) {
            const rows = [];
            for (let i = 0; i < 3; i++) {
                const row = new ActionRowBuilder();
                for (let j = 0; j < 3; j++) {
                    const index = i * 3 + j;
                    const val = board[index];
                    const button = new ButtonBuilder()
                        .setCustomId(`ttt_${index}`)
                        .setStyle(val === 'X' ? ButtonStyle.Primary : val === 'O' ? ButtonStyle.Danger : ButtonStyle.Secondary)
                        .setLabel(val || '\u200b')
                        .setDisabled(disabled || val !== null);
                    row.addComponents(button);
                }
                rows.push(row);
            }
            return rows;
        }

        const response = await interaction.reply({
            content: `Tic-Tac-Toe! **${p1.username}** (X) vs **${p2.username}** (O)\n\nIt is ${currentPlayer}'s turn!`,
            components: createGrid()
        });

        const collector = response.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async i => {
            if (i.user.id !== currentPlayer.id) {
                return i.reply({ content: "It's not your turn!", ephemeral: true });
            }

            const index = parseInt(i.customId.split('_')[1]);
            const marker = currentPlayer.id === p1.id ? 'X' : 'O';
            board[index] = marker;

            const winner = checkWin();
            if (winner) {
                collector.stop('ended');
                let endContent = '';
                if (winner === 'draw') {
                    endContent = "The game ended in a draw!";
                } else {
                    endContent = `🏆 ${currentPlayer} won the game!`;
                }
                await i.update({
                    content: `**Game Over!**\nPlayers: ${p1} vs ${p2}\n\n${endContent}`,
                    components: createGrid(true)
                });
            } else {
                currentPlayer = currentPlayer.id === p1.id ? p2 : p1;
                await i.update({
                    content: `Tic-Tac-Toe! **${p1.username}** (X) vs **${p2.username}** (O)\n\nIt is ${currentPlayer}'s turn!`,
                    components: createGrid()
                });
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'ended') {
                interaction.editReply({ content: 'The game timed out!', components: createGrid(true) }).catch(() => {});
            }
        });
    },
};

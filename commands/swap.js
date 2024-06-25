const { SlashCommandBuilder } = require('@discordjs/builders');

let {servers, queueMessageBuilder} = require('../globals.js');

module.exports = {
    data: new SlashCommandBuilder().setName('swap')
        .setDescription('swaps a song with another song in the queue')
        .addIntegerOption( option =>
            option.setName('this')
                .setDescription('the position of the first song you want to swap')
                .setRequired(true))
        .addIntegerOption( option =>
            option.setName('and')
                .setDescription('the position of the second song you want to swap')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        if (servers.get(interaction.guildId).queue.length == 0) {
            await interaction.editReply('```There\'s nothing in the queue```');
            return;
        }

        let from = interaction.options.getInteger('this') - 1;
        let to = interaction.options.getInteger('and') - 1;

        if (from < 0 || from >= servers.get(interaction.guildId).queue.length) {
            await interaction.editReply("```That isn't a valid position to swap from in the queue!```");
            return;
        }

        if (to < 0 || to >= servers.get(interaction.guildId).queue.length) {
            await interaction.editReply("```That isn't a valid position to swap to in the queue!```");
            return;
        }

        if (from != to) {
            let temp = servers.get(interaction.guildId).queue[from];
            servers.get(interaction.guildId).queue[from] = servers.get(interaction.guildId).queue[to];
            servers.get(interaction.guildId).queue[to] = temp;

            await interaction.editReply(`\`\`\`bash\nSwapped "${servers.get(interaction.guildId).queue[from].title}" with "${servers.get(interaction.guildId).queue[to].title}"\n\`\`\``);
        } else {
            await interaction.editReply("```It's already in that position!```");
            return;
        }

        await queueMessageBuilder(interaction, servers.get(interaction.guildId).queue);

        console.log(`[${interaction.guild.name}] swapped ${from} and ${to}`);
    }
}
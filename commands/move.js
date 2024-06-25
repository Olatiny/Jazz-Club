const { SlashCommandBuilder } = require('@discordjs/builders');

let {servers, queueMessageBuilder} = require('../globals.js');

module.exports = {
    data: new SlashCommandBuilder().setName('move')
        .setDescription('moves an item to a desired place in the queue')
        .addIntegerOption( option =>
            option.setName('from')
                .setDescription('the current position of the song you want to move')
                .setRequired(true))
        .addIntegerOption( option =>
            option.setName('to')
                .setDescription('the position you want to move the song to')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        if (servers.get(interaction.guildId).queue.length == 0) {
            await interaction.editReply('```There\'s nothing in the queue```');
            return;
        }

        let from = interaction.options.getInteger('from') - 1;
        let to = interaction.options.getInteger('to') - 1;

        if (from < 0 || from >= servers.get(interaction.guildId).queue.length) {
            await interaction.editReply("```That isn't a valid position to move from in the queue!```");
            return;
        }

        if (to < 0 || to >= servers.get(interaction.guildId).queue.length) {
            await interaction.editReply("```That isn't a valid position to move to in the queue!```");
            return;
        }

        if (from != to) {
            let temp = servers.get(interaction.guildId).queue[from];
            servers.get(interaction.guildId).queue.splice(from, 1);
            servers.get(interaction.guildId).queue.splice(to, 0, temp);

            await interaction.editReply(`\`\`\`bash\nMoved "${temp.title}" to position ${to + 1}\n\`\`\``);
        } else {
            await interaction.editReply("```It's already in that position!```");
            return;
        }

        await queueMessageBuilder(interaction, servers.get(interaction.guildId).queue);

        console.log(`[${interaction.guild.name}] moved ${from} to ${to}`);
    }
}
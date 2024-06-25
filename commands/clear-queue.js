const { SlashCommandBuilder } = require('@discordjs/builders');

let {servers, Server} = require('../globals.js');

module.exports = {
    data: new SlashCommandBuilder().setName('clear-queue')
        .setDescription('Clears the queue of all of its contents'),
    async execute(interaction) {
        await interaction.deferReply();

        servers.get(interaction.guildId).queue = [];
        // queues.set(interaction.guildId, []);

        await interaction.editReply("```The queue was cleared of all songs```");
        console.log(`[${interaction.guild.name}] cleared the queue`);
    }
}
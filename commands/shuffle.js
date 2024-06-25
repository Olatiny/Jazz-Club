const { SlashCommandBuilder } = require('@discordjs/builders');

// let {queues, currSongs, nowPlayingCodeBlockVersion, queueMessageBuilder} = require('../globals.js');
let {servers, nowPlayingCodeBlockVersion, queueMessageBuilder} = require('../globals.js');

module.exports = {
    data: new SlashCommandBuilder().setName('shuffle')
        .setDescription('Shuffles the queue'),
    async execute(interaction) {
        await interaction.deferReply();

        for (let i = servers.get(interaction.guildId).queue.length - 1; i >= 1; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = servers.get(interaction.guildId).queue[j];
            servers.get(interaction.guildId).queue[j] = servers.get(interaction.guildId).queue[i];
            servers.get(interaction.guildId).queue[i] = temp;
        }

        await interaction.editReply("```Shuffling the queue```");
        await interaction.channel.send(nowPlayingCodeBlockVersion(servers.get(interaction.guildId).currentSong));
        await queueMessageBuilder(interaction, servers.get(interaction.guildId).queue);
    }
}
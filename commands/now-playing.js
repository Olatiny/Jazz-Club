const { SlashCommandBuilder } = require('@discordjs/builders');

let {servers, nowPlayingMessageBuilder} = require('../globals.js');

module.exports = {
    data: new SlashCommandBuilder().setName('now-playing')
        .setDescription('Shows the song that is currently playing'),
    async execute(interaction) {
        await interaction.deferReply();

        if (!servers.get(interaction.guildId).isPlaying) {
            await interaction.editReply("```Nothing is playing right now.```");
        } else {
            await interaction.editReply({embeds: [await nowPlayingMessageBuilder(servers.get(interaction.guildId).currentSong, interaction.guildId)]});
        }
    }
}
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');

// let {queues, players, playing, repeating, hasListener, currSongs, hasDisconnected, disconnectTimers, queueMessages, startTimes, funkyMode, funkyTimeout} = require('../globals.js');
let {servers, Server} = require('../globals.js');

module.exports = {
    data: new SlashCommandBuilder().setName('exit')
	    .setDescription('Stops the player and exits voice chat'),
    async execute(interaction) {
        await interaction.deferReply();

        await servers.get(interaction.guildId).disconnect();
        servers.set(interaction.guildId, null);
        servers.delete(interaction.guildId);

        console.log("donezo");

        // hasDisconnected.set(interaction.guildId, true);

        // queues.delete(interaction.guildId);
        // await players.get(interaction.guildId).stop();
        // players.delete(interaction.guildId);
        // getVoiceConnection(interaction.guildId).destroy();
        // // connections.delete(interaction.guildId);
        // currSongs.delete(interaction.guildId);
        // playing.delete(interaction.guildId);
        // repeating.delete(interaction.guildId);
        // hasListener.delete(interaction.guildId);
        // disconnectTimers.delete(interaction.guildId);
        // queueMessages.delete(interaction.guildId);
        // startTimes.delete(interaction.guildId);
        // funkyMode.delete(interaction.guildId);
        // funkyTimeout.delete(interaction.guildId);

        await interaction.editReply('```Stopping the player and exiting the voice chat.\n```');
        console.log(`[${interaction.guild.name}] Stopping the player`);
    }
}
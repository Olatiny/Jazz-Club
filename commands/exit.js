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

        await interaction.editReply('```Stopping the player and exiting the voice chat.\n```');
        console.log(`[${interaction.guild.name}] Stopping the player`);
    }
}
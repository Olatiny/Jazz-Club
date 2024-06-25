const { SlashCommandBuilder } = require('@discordjs/builders');

let {servers} = require('../globals.js');

module.exports = {
    data: new SlashCommandBuilder().setName('pause')
	    .setDescription('Pauses the song currently playing'),
    async execute(interaction) {
        await interaction.deferReply();

        let temp;

        if (temp = (servers.get(interaction.guildId).audioPlayer.state.status == 'paused')) {
            servers.get(interaction.guildId).audioPlayer.unpause();
        } else {
            servers.get(interaction.guildId).audioPlayer.pause();
        }

        console.log(servers.get(interaction.guildId).audioPlayer.state.status);

        await interaction.editReply(`\`\`\`bash\n ${temp ? 'Resuming' : 'Pausing'} "${servers.get(interaction.guildId).currentSong.title}"\n\`\`\``);

        console.log(`[${interaction.guild.name}] ${temp ? 'Resuming' : 'Pausing'} the player`);
    }
}
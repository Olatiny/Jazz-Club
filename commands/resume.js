const { SlashCommandBuilder } = require('@discordjs/builders');

// let {players, currSongs} = require('../globals.js');
let {servers} = require('../globals.js');

module.exports = {
    data: new SlashCommandBuilder().setName('resume')
	    .setDescription('Resumes the song currently playing'),
    async execute(interaction) {
        await interaction.deferReply();

        servers.get(interaction.guildId).audioPlayer.unpause();

        await interaction.editReply(`\`\`\`bash\nResuming "${servers.get(interaction.guildId).currentSong.title}"\n\`\`\``);

        console.log(`[${interaction.guild.name}] Resuming the player`);
    }
}
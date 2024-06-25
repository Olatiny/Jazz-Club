const { SlashCommandBuilder } = require('@discordjs/builders');

// let {queues, playing, currSongs, queueMessageBuilder, nowPlayingCodeBlockVersion} = require('../globals.js');
let {servers, queueMessageBuilder, nowPlayingCodeBlockVersion} = require('../globals.js');

module.exports = {
    data: new SlashCommandBuilder().setName('queue')
        .setDescription('Shows the current queue')
        .addIntegerOption( option => 
            option.setName('remove')
                .setDescription('remove a song from the queue using it\'s number.')
                .setRequired(false)),
        // .addIntegerOption( option => {
        //     return option.setName('pages')
        //         .setDescription('Number of pages to print out from the queue (1 by default)')
        //         .setRequired(false)
        //     }),
    async execute(interaction) {
        await interaction.deferReply();

        let queue = servers.get(interaction.guildId).queue;
        let pages = interaction.options.getInteger('pages');

        // console.log(pages ? pages : 1);

        if (queue.length == 0) {
            if (servers.get(interaction.guildId).isPlaying) {
                await interaction.editReply(nowPlayingCodeBlockVersion(servers.get(interaction.guildId).currentSong));
                await interaction.channel.send("```There aren't any songs in the queue.\n```");
                return;
            }

            await interaction.editReply("```There aren't any songs in the queue.\n```");
            return;
        }

        let index_to_remove = interaction.options.getInteger('remove');

        if (index_to_remove) {
            await interaction.editReply(`\`\`\`bash\nRemoving "${queue[index_to_remove - 1].title}" from the queue\n\`\`\``);
            queue.splice(index_to_remove - 1, 1);
        }

        if (index_to_remove) {
            await interaction.channel.send(nowPlayingCodeBlockVersion(servers.get(interaction.guildId).currentSong));
            // await interaction.channel.send(queueMessageBuilder(servers.get(interaction.guildId).queue));
            // console.log("index to remove done");
            await queueMessageBuilder(interaction, servers.get(interaction.guildId).queue);
        } else {
            await interaction.editReply(nowPlayingCodeBlockVersion(servers.get(interaction.guildId).currentSong));
            // await interaction.channel.send(queueMessageBuilder(servers.get(interaction.guildId).queue));
            // console.log("index to remove not done");
            await queueMessageBuilder(interaction, servers.get(interaction.guildId).queue);
        }
    }
}
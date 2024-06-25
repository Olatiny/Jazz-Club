const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioResource } = require('@discordjs/voice');
// let {queues, players, playing, repeating, currSongs, startTimes} = require('../globals.js');
let {servers} = require('../globals.js');

const video_downloader = require('play-dl');
const ytSearch = require('yt-search');

video_downloader.getFreeClientID().then((clientId) => video_downloader.setToken({
    soundcloud : {
        client_id : clientId
    }
}));

module.exports = {
    data: new SlashCommandBuilder().setName('skip')
        .setDescription('Skips to the next song in the queue, if there is one.')
        .addIntegerOption( option =>
            option.setName('to')
                .setDescription('Skip right to a certain position instead of one song at a time!')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();

        let skip_to_index = interaction.options.getInteger('to');

        if (skip_to_index) {
            skip_to_index--;

            if (skip_to_index < 0 || skip_to_index >= servers.get(interaction.guildId).queue.length) {
                await interaction.editReply("```That isn't a valid position in the queue!```");
                return;
            }

            servers.get(interaction.guildId).queue.splice(0, skip_to_index);

            let vid = servers.get(interaction.guildId).queue[0]

            servers.get(interaction.guildId).audioPlayer.pause();

            let type = await video_downloader.validate(servers.get(interaction.guildId).queue[0].url);

            let title = undefined;

            if (type.startsWith('sp')) {
                title = servers.get(interaction.guildId).queue[0].name;

                while ((servers.get(interaction.guildId).queue[0] = (await ytSearch(vid.artist + ", " + vid.name + " in " + vid.list)).videos[0]) == undefined) {
                    servers.get(interaction.guildId).queue.splice(0, 1);
                    title = servers.get(interaction.guildId).queue[0].name;
                }
            }

            while (servers.get(interaction.guildId).queue[0] == undefined) {
                servers.get(interaction.guildId).queue.splice(0, 1);
            }

            await interaction.editReply(`\`\`\`bash\nSkipping to "${title ? title : servers.get(interaction.guildId).queue[0].title}"\`\`\``);

            // currSongs.set(interaction.guildId, servers.get(interaction.guildId).queue[0]);
            servers.get(interaction.guildId).currentSong = servers.get(interaction.guildId).queue[0];
            servers.get(interaction.guildId).queue.splice(0, 0 + 1);

            var currentSong = await video_downloader.stream(servers.get(interaction.guildId).currentSong.url);
            const currentResource = createAudioResource(currentSong.stream, {
                inputType: currentSong.type
            });

            servers.get(interaction.guildId).currentStream.stream.destroy();
            servers.get(interaction.guildId).currentStream = currentSong;

            servers.get(interaction.guildId).audioPlayer.play(currentResource);

            servers.get(interaction.guildId).startTime = Date.now()/1000;

            return;
        }

        if (servers.get(interaction.guildId).queue.length > 0 && servers.get(interaction.guildId).repeating) {
            await interaction.editReply(`\`\`\`bash\nskipping \"${servers.get(interaction.guildId).currentSong.title}\"\`\`\``);

            // console.log(servers.get(interaction.guildId).queue[0].title);

            let vid = servers.get(interaction.guildId).queue[0]

            let type = await video_downloader.validate(servers.get(interaction.guildId).queue[0].url);

            if (type.startsWith('sp')) {
                while ((servers.get(interaction.guildId).queue[0] = (await ytSearch(vid.name + " in " + vid.list)).videos[0]) == undefined) {
                    servers.get(interaction.guildId).queue.splice(0, 1);
                };
            }

            // currSongs.set(interaction.guildId, servers.get(interaction.guildId).queue[0]);
            servers.get(interaction.guildId).currentSong = servers.get(interaction.guildId).queue[0];
            servers.get(interaction.guildId).queue.splice(0, 1);

            // console.log(servers.get(interaction.guildId).queue[0].title);
            // console.log(servers.get(interaction.guildId).currentSong.title);

            var currentSong = await video_downloader.stream(servers.get(interaction.guildId).currentSong.url);

            const currentResource = createAudioResource(currentSong.stream, {
                inputType: currentSong.type
            });

            servers.get(interaction.guildId).currentStream.stream.destroy();
            servers.get(interaction.guildId).currentStream = currentSong;

            servers.get(interaction.guildId).audioPlayer.pause();
            servers.get(interaction.guildId).audioPlayer.play(currentResource);

            servers.get(interaction.guildId).startTime = Date.now()/1000;

            return;
        } else if (servers.get(interaction.guildId).queue.length == 0) {
            // playing.set(interaction.guildId, false);
            servers.get(interaction.guildId).isPlaying = false;
            // repeating.set(interaction.guildId, false);
        }

        servers.get(interaction.guildId).audioPlayer.stop();

        if (!servers.get(interaction.guildId).isPlaying && !servers.get(interaction.guildId).currentSong) {
            if (!interaction.replied) {
                await interaction.editReply("```bash\nNothing is currently playing```");
            } else {
                await interaction.channel.send("```bash\nNothing is currently playing```");
            }

            return;
        }

        if (!interaction.replied) {
            await interaction.editReply(`\`\`\`bash\nskipping \"${servers.get(interaction.guildId).currentSong.title}\"\`\`\``);
        } else {
            await interaction.channel.send(`\`\`\`bash\nskipping \"${servers.get(interaction.guildId).currentSong.title}\"\`\`\``);
        }
        servers.get(interaction.guildId).startTime = Date.now()/1000;
    }
}
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const { MessageAttachment } = require('discord.js');

const video_downloader = require('play-dl');
const ytdl = require("ytdl-core-discord");
const ytSearch = require('yt-search');

// let {queues, players, playing, currSongs, startTimes, nowPlayingMessageBuilder, addedToQueueEmbedBuilder} = require('../globals.js');
let {servers, nowPlayingMessageBuilder, addedToQueueEmbedBuilder} = require('../globals.js');

video_downloader.getFreeClientID().then((clientId) => video_downloader.setToken({
    soundcloud : {
        client_id : clientId
    }
}));

module.exports = {
    data: new SlashCommandBuilder().setName('play-mix')
        .setDescription('Grabs the top 20 YouTube results for a query and puts them in the queue')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The YouTube search query')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        if (video_downloader.is_expired()) {
            await video_downloader.refreshToken() // This will check if access token has expired or not. If yes, then refresh the token.
        }

        // YouTube Search
        // console.log(interaction.options.getString('link-or-query'));
        let mix = (await video_downloader.search(interaction.options.getString('query'), {source: {youtube: "video"}, limit: 20}));

        // If the player is currently playing a song, add this one to the queue.
        if (servers.get(interaction.guildId).isPlaying) {
            if (mix) {
                servers.get(interaction.guildId).queue.push(...mix);

                await interaction.editReply("```bash\nCreated a mix based on the query: \"" + interaction.options.getString('query') + "\" to the queue```");
                console.log(`[${interaction.guild.name}] added to queue`);
            }
            return;
        }
        
        // If the player isn't currently playing a song, and the video isn't null, start playing it! Otherwise, don't add anything and reply that nothing was found
        if (mix) {
            // Setting the global video variable to mix, so we can track the currently playing video outside this function.
            // currSongs.set(interaction.guildId, mix);
            servers.get(interaction.guildId).currentSong = mix[0];
            
            // Plays the video
            // var currentSong = await video_downloader.stream(mix[0].url);
            var currentSong = await ytdl(mix[0].url, {
                highWaterMark: 1 << 62,
                liveBuffer: 1 << 62,
                dlChunkSize: 0,
                quality: 'lowestaudio'
            });

            const currentResource = createAudioResource(currentSong, {
                inputType: currentSong.type
            });

            servers.get(interaction.guildId).currentStream = currentSong;

            // currentSong.stream.destroy();

            // console.log(mix.channel);
            
            servers.get(interaction.guildId).audioPlayer.stop();
            
            servers.get(interaction.guildId).audioPlayer.play(currentResource);
            getVoiceConnection(interaction.guildId).subscribe(servers.get(interaction.guildId).audioPlayer);

            servers.get(interaction.guildId).isPlaying = true;

            mix.splice(0, 1);
            servers.get(interaction.guildId).queue.push(...mix);

            console.log(`[${interaction.guild.name}] playing song`);

            // `Playing \"${video.title}\" (${video.url})`
            await interaction.editReply("```bash\nCreated a mix based on the query: \"" + interaction.options.getString('query') + "\" to the queue```");
            servers.get(interaction.guildId).startTime = Date.now()/1000;
        } else {
            interaction.editReply('```nothing found :(```');
            console.log(`[${interaction.guild.name}] nothing found`);
        }
    }
};

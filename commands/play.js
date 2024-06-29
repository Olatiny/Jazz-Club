const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const { MessageAttachment } = require('discord.js');

const video_downloader = require('play-dl3');
const ytSearch = require('yt-search');

// let {queues, players, playing, currSongs, startTimes, nowPlayingMessageBuilder, addedToQueueEmbedBuilder} = require('../globals.js');
let {servers, nowPlayingMessageBuilder, addedToQueueEmbedBuilder} = require('../globals.js');

video_downloader.getFreeClientID().then((clientId) => video_downloader.setToken({
    soundcloud : {
        client_id : clientId
    }
}));

module.exports = {
    data: new SlashCommandBuilder().setName('play')
        .setDescription('Plays the youtube video you want')
        .addStringOption(option =>
            option.setName('link-or-query')
                .setDescription('The Link or Query for the YouTube or Spotify audio you would like to play')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        if (video_downloader.is_expired()) {
            await video_downloader.refreshToken() // This will check if access token has expired or not. If yes, then refresh the token.
        }

        let type = await video_downloader.validate(interaction.options.getString('link-or-query'));

        if (!type) {
            await interaction.editReply("```That isn\'t a valid YouTube or Spotify link, but I\'ll try searching it anyways.```");
            type = 'search';
        }

        // The video to be played
        let localvideo = null;
        let sp_dat = undefined;
        let sp_tracks = undefined;
        let file = new MessageAttachment('https://cdn.discordapp.com/emojis/397202668952748043.gif?size=160&quality=lossless');

        /**
         * Searching the videos on the internet. It will first check for Spotify, then Soundcloud, then YouTube, and then finally do a YouTube search.
         */
        if (type.startsWith('sp')) { //Spotify URL
            sp_dat = await video_downloader.spotify(interaction.options.getString('link-or-query'));
            sp_tracks = undefined;
            isSpotify = true;

            // Switch over different spotify link types
            switch (sp_dat.type) {
                // Spotify album
                case 'album':
                    sp_tracks = await sp_dat.all_tracks();
                    localvideo = new Array(sp_tracks.length);

                    if (localvideo.length <= 0) {
                        interaction.editReply('```Nothing found :(```');
                        console.log(`[${interaction.guild.name}] no spotify playlist/album found`);
                        return;
                    }

                    if (servers.get(interaction.guildId).isPlaying) {
                        await interaction.editReply("```bash\nAdding a playlist, this could take a while.```");
                        let msg = await interaction.channel.send({files: [file]});
    
                        // for (let i = 0; i < localvideo.length; i++) {
                        //     localvideo[i] = (await ytSearch(sp_tracks[i].name + " in " + sp_dat.name)).videos[0];
                        //     if (localvideo[i] == undefined) {
                        //         continue;
                        //     }
                        //     queues.get(interaction.guildId).push(localvideo[i]);
                        // }

                        sp_tracks.forEach(function (element) {
                            element.list = sp_dat.name;
                            element.artist = element.artists[0].name;
                        });
    
                        servers.get(interaction.guildId).queue.push(...sp_tracks);

                        msg.delete();
                        await interaction.editReply("```bash\nAdded the Spotify Playlist/Album: \"" + sp_dat.name + "\" to the queue```");
                    } else {
                        await interaction.editReply("```bash\nAdding a playlist, this could take a while.```");
                        let msg = await interaction.channel.send({files: [file]});
    
                        while ((localvideo[0] = (await ytSearch(sp_tracks[0].artists[0].name + ", " + sp_tracks[0].name + " in " + sp_dat.name)).videos[0]) == undefined) {
                            localvideo.splice(0, 1);
                            sp_tracks.splice(0, 1); 
                        }
    
                        // currSongs.set(interaction.guildId, localvideo[0]);
                        servers.get(interaction.guildId).currentSong = localvideo[0];
    
                        const currentSong = await video_downloader.stream(localvideo[0].url);

                        servers.get(interaction.guildId).currentStream = currentSong;
                        
                        const currentResource = createAudioResource(currentSong.stream, {
                            inputType: currentSong.type
                        });
    
                        servers.get(interaction.guildId).audioPlayer.stop();
                        servers.get(interaction.guildId).audioPlayer.play(currentResource);
                        getVoiceConnection(interaction.guildId).subscribe(servers.get(interaction.guildId).audioPlayer);
                        servers.get(interaction.guildId).isPlaying = true;
    
                        localvideo.splice(0, 1);
                        sp_tracks.splice(0, 1);
    
                        // for (let i = 0; i < localvideo.length; i++) {
                        //     localvideo[i] = (await ytSearch(sp_tracks[i].name + " in " + sp_dat.name)).videos[0];
                        //     if (localvideo[i] == undefined) {
                        //         continue;
                        //     }
                        //     servers.get(interaction.guildId).queue.push(localvideo[i]);
                        // }

                        sp_tracks.forEach(function (element) {
                            element.list = sp_dat.name;
                            element.artist = element.artists[0].name;
                        });
                        
                        servers.get(interaction.guildId).queue.push(...sp_tracks);
                        
                        msg.delete();
                        await interaction.editReply("```bash\nAdded the Spotify Playlist/Album: \"" + sp_dat.name + "\" to the queue```");
                    }

                    console.log(`[${interaction.guild.name}] Added a Spotify Playlist/Album to the queue`);

                    break;
                
                // Spotify playlist
                case 'playlist':
                    sp_tracks = await sp_dat.all_tracks();
                    localvideo = new Array(sp_tracks.length);

                    if (localvideo.length <= 0) {
                        interaction.editReply('Nothing found :(');
                        console.log(`[${interaction.guild.name}] no spotify playlist/album found`);
                        return;
                    }

                    if (servers.get(interaction.guildId).isPlaying) {
                        await interaction.editReply("```bash\nAdding a playlist, this could take a while.```");
                        let msg = await interaction.channel.send({files: [file]});
    
                        // for (let i = 0; i < localvideo.length; i++) {
                        //     localvideo[i] = (await ytSearch(sp_tracks[i].name + " in " + sp_dat.name)).videos[0];
                        //     if (localvideo[i] == undefined) {
                        //         continue;
                        //     }
                        //     servers.get(interaction.guildId).queue.push(localvideo[i]);
                        // }

                        sp_tracks.forEach(function (element) {
                            element.list = element.album.name;
                            element.artist = element.artists[0].name;
                        });
    
                        servers.get(interaction.guildId).queue.push(...sp_tracks);

                        msg.delete();
                        await interaction.editReply("```bash\nAdded the Spotify Playlist/Album: \"" + sp_dat.name + "\" to the queue```");
                    } else {
                        await interaction.editReply("```bash\nAdding a playlist, this could take a while.```");
                        let msg = await interaction.channel.send({files: [file]});
    
                        while ((localvideo[0] = (await ytSearch(sp_tracks[0].artists[0].name + ", " + sp_tracks[0].name + " in " + sp_tracks[0].album.name)).videos[0]) == undefined) {
                            localvideo.splice(0, 1);
                            sp_tracks.splice(0, 1); 
                        }
    
                        // currSongs.set(interaction.guildId, localvideo[0]);
                        servers.get(interaction.guildId).currentSong = localvideo[0];
    
                        const currentSong = await video_downloader.stream(localvideo[0].url);

                        servers.get(interaction.guildId).currentStream = currentSong;
                        
                        const currentResource = createAudioResource(currentSong.stream, {
                            inputType: currentSong.type
                        });
    
                        servers.get(interaction.guildId).audioPlayer.stop();
                        servers.get(interaction.guildId).audioPlayer.play(currentResource);
                        getVoiceConnection(interaction.guildId).subscribe(servers.get(interaction.guildId).audioPlayer);
                        servers.get(interaction.guildId).isPlaying = true;
    
                        localvideo.splice(0, 1);
                        sp_tracks.splice(0, 1);
    
                        // for (let i = 0; i < localvideo.length; i++) {
                        //     localvideo[i] = (await ytSearch(sp_tracks[i].name + " in " + sp_dat.name)).videos[0];
                        //     if (localvideo[i] == undefined) {
                        //         continue;
                        //     }
                        //     servers.get(interaction.guildId).queue.push(localvideo[i]);
                        // }

                        sp_tracks.forEach(function (element) {
                            element.list = element.album.name;
                            element.artist = element.artists[0].name;
                        });
    
                        servers.get(interaction.guildId).queue.push(...sp_tracks);

                        msg.delete();
                        await interaction.editReply("```bash\nAdded the Spotify Playlist/Album: \"" + sp_dat.name + "\" to the queue```");
                    }
                    
                    console.log(`[${interaction.guild.name}] Added a Spotify Playlist/Album to the queue`);

                    break;

                // Spotify track
                case 'track': 
                    localvideo = (await video_downloader.search(sp_dat.artists[0].name + ", " + sp_dat.name + " in " + sp_dat.album.name, {source: {youtube: "video"}, limit: 1}))[0];

                    if (servers.get(interaction.guildId).isPlaying) {
                        if (localvideo == undefined) {
                            await interaction.editReply("```bash\nCouldn't find the Spotify Song on YouTube.```");
                            console.log(`[${interaction.guild.name}] could not find Spotify song.`);
                            return;
                        }
                        servers.get(interaction.guildId).queue.push(localvideo);
                        await interaction.editReply({embeds: [await addedToQueueEmbedBuilder(localvideo, servers.get(interaction.guildId).queue.length)]});
                        console.log(`[${interaction.guild.name}] from Spotify added to queue`);
                    } else {
                        if (localvideo) {
                            if (localvideo == undefined) {
                                await interaction.editReply("```bash\nCouldn't find the Spotify Song on YouTube.```");
                                console.log(`[${interaction.guild.name}] could not find Spotify song.`);
                                return;
                            }
    
                            // Setting the global video variable to localVideo, so we can track the currently playing video outside this function.
                            // currSongs.set(interaction.guildId, localvideo);
                            servers.get(interaction.guildId).currentSong = localvideo;
                            
                            // Downloads the video and starts to play it
                            // var currentSong = await video_downloader.stream(localvideo.url);
                            var currentSong = await video_downloader.stream(localvideo.url);
                            const currentResource = createAudioResource(currentSong.stream, {
                                inputType: currentSong.type
                            });

                            servers.get(interaction.guildId).currentStream = currentSong;
                            
                            servers.get(interaction.guildId).audioPlayer.stop();
                            servers.get(interaction.guildId).audioPlayer.play(currentResource);
                            getVoiceConnection(interaction.guildId).subscribe(servers.get(interaction.guildId).audioPlayer);
    
                            servers.get(interaction.guildId).isPlaying = true;
    
                            console.log(`[${interaction.guild.name}] playing Spotify song`);

                            servers.get(interaction.guildId).startTime = Date.now()/1000;
    
                            // `Playing \"${video.title}\" (${video.url})`
                            await interaction.editReply({embeds: [await nowPlayingMessageBuilder(localvideo, interaction.guildId)]});
                        } else {
                            interaction.editReply('```nothing found :(```');
                            console.log(`[${interaction.guild.name}] nothing found`);
                        }
                    }

                    break;

                // Not valid spotify, search on YT.
                default:
                    await interaction.channel.send('```That isn\'t a valid YouTube or Spotify link, but I\'ll try searching it anyways.```');
                    localvideo = (await video_downloader.search(interaction.options.getString('link-or-query'), {source: {youtube: "video"}, limit: 1}))[0];

                    if (servers.get(interaction.guildId).isPlaying) {
                        if (localvideo == undefined) {
                            await interaction.editReply("```bash\nCouldn't find the Spotify Song on YouTube.```");
                            console.log(`[${interaction.guild.name}] could not find Spotify song.`);
                            return;
                        }
                        servers.get(interaction.guildId).queue.push(localvideo);
                        await interaction.editReply({embeds: [await addedToQueueEmbedBuilder(localvideo, servers.get(interaction.guildId).queue.length)]});
                        console.log(`[${interaction.guild.name}] from Spotify added to queue`);
                    } else {
                        if (localvideo) {
                            if (localvideo == undefined) {
                                await interaction.editReply("```bash\nCouldn't find the Spotify Song on YouTube.```");
                                console.log(`[${interaction.guild.name}] could not find Spotify song.`);
                                return;
                            }
    
                            // Setting the global video variable to localVideo, so we can track the currently playing video outside this function.
                            // currSongs.set(interaction.guildId, localvideo);
                            servers.get(interaction.guildId).currentSong = localvideo;
                            
                            // Downloads the video and starts to play it
                            // var currentSong = await video_downloader.stream(localvideo.url);
                            var currentSong = await video_downloader.stream(localvideo.url);
                            const currentResource = createAudioResource(currentSong.stream, {
                                inputType: currentSong.type
                            });

                            servers.get(interaction.guildId).currentStream = currentSong;
                            
                            servers.get(interaction.guildId).audioPlayer.stop();
                            servers.get(interaction.guildId).audioPlayer.play(currentResource);
                            getVoiceConnection(interaction.guildId).subscribe(servers.get(interaction.guildId).audioPlayer);
    
                            servers.get(interaction.guildId).isPlaying = true;
    
                            console.log(`[${interaction.guild.name}] playing Spotify song`);
    
                            servers.get(interaction.guildId).startTime = Date.now()/1000;
                            // `Playing \"${video.title}\" (${video.url})`
                            await interaction.editReply({embeds: [await nowPlayingMessageBuilder(localvideo, interaction.guildId)]});
                        } else {
                            interaction.editReply('```nothing found :(```');
                            console.log(`[${interaction.guild.name}] nothing found`);
                        }
                    }

                    break;
            }

        // Soundcloud
        } else if (type.startsWith('so')) {
            if (type.includes('playlist')) {
                let list = (await video_downloader.soundcloud(interaction.options.getString('link-or-query')));

                let tracks = await list.all_tracks();

                if (tracks.length <= 0) {
                    interaction.editReply('Nothing found :(');
                    console.log(`[${interaction.guild.name}] no playlist found`);
                    return;
                }

                tracks.forEach(element => {
                    element.title = element.name;
                    element.author = element.user;
                    let temp = (new Date(0));
                    temp.setSeconds(Number(element.durationInSec));
                    element.timestamp = temp.toISOString().substring(14, 19);
    
                });

                if (servers.get(interaction.guildId).isPlaying) {
                    servers.get(interaction.guildId).queue.push(...tracks);
                    await interaction.editReply("```bash\nAdded the soundcloud playlist: \"" + list.name + "\" to the queue```");
                } else {
                    let track = tracks[0];

                    // currSongs.set(interaction.guildId, track);
                    servers.get(interaction.guildId).currentSong = track;
    
                    // var currentSong = await video_downloader.stream(video.url);
                    var currentSong = await video_downloader.stream(track.url);
                    const currentResource = createAudioResource(currentSong.stream, {
                        inputType: currentSong.type
                    });

                    servers.get(interaction.guildId).currentStream = currentSong;

                    servers.get(interaction.guildId).audioPlayer.stop();
                    servers.get(interaction.guildId).audioPlayer.play(currentResource);
                    getVoiceConnection(interaction.guildId).subscribe(servers.get(interaction.guildId).audioPlayer);

                    servers.get(interaction.guildId).isPlaying = true;

                    tracks.splice(0, 1);

                    servers.get(interaction.guildId).queue.push(...tracks);

                    servers.get(interaction.guildId).startTime = Date.now()/1000;
    
                    await interaction.editReply("```bash\nAdded the soundcloud playlist: \"" + list.name + "\" to the queue```");
                }
            } else if (type.includes('track')) {
                let track = (await video_downloader.soundcloud(interaction.options.getString('link-or-query')));
                track.title = track.name;
                track.author = track.user;
                track.author.name = track.user.name;
                track.channel = track.user;
                let temp = (new Date(0));
                temp.setSeconds(Number(track.durationInSec));
                track.timestamp = temp.toISOString().substring(14, 19);

                if (servers.get(interaction.guildId).isPlaying) {
                    servers.get(interaction.guildId).queue.push(track);
                    await interaction.editReply({embeds: [await addedToQueueEmbedBuilder(track, servers.get(interaction.guildId).queue.length)]});
                    console.log(`[${interaction.guild.name}] added to queue`);
                } else {
                    // currSongs.set(interaction.guildId, track);
                    servers.get(interaction.guildId).currentSong = track;
    
                    // var currentSong = await video_downloader.stream(video.url);
                    var currentSong = await video_downloader.stream(track.url);
                    const currentResource = createAudioResource(currentSong.stream, {
                        inputType: currentSong.type
                    });

                    servers.get(interaction.guildId).currentStream = currentSong;

                    servers.get(interaction.guildId).audioPlayer.stop();
                    servers.get(interaction.guildId).audioPlayer.play(currentResource);
                    getVoiceConnection(interaction.guildId).subscribe(servers.get(interaction.guildId).audioPlayer);

                    servers.get(interaction.guildId).isPlaying = true;

                    servers.get(interaction.guildId).startTime = Date.now()/1000;
    
                    await interaction.editReply({embeds: [await nowPlayingMessageBuilder(track, interaction.guildId)]});
                }
            }

        //YouTube URL
        } else if (type.startsWith('yt')) { 
            if (type.includes('playlist')) {
                localvideo = await video_downloader.playlist_info(interaction.options.getString('link-or-query'), {incomplete: true});
                let videos = await localvideo.all_videos();

                if (localvideo.length <= 0) {
                    interaction.editReply('Nothing found :(');
                    console.log(`[${interaction.guild.name}] no playlist found`);
                    return;
                }

                if (servers.get(interaction.guildId).isPlaying) {
                    servers.get(interaction.guildId).queue.push(...videos);
                    await interaction.editReply("```bash\nAdded the playlist: \"" + localvideo.title + "\" to the queue```");
                } else {
                    let video = videos[0];
                    // currSongs.set(interaction.guildId, video);
                    servers.get(interaction.guildId).currentSong = video;
    
                    // var currentSong = await video_downloader.stream(video.url);
                    var currentSong = await video_downloader.stream(video.url);
                    const currentResource = createAudioResource(currentSong.stream, {
                        inputType: currentSong.type
                    });
    
                    servers.get(interaction.guildId).currentStream = currentSong;

                    servers.get(interaction.guildId).audioPlayer.stop();
                    servers.get(interaction.guildId).audioPlayer.play(currentResource);
                    getVoiceConnection(interaction.guildId).subscribe(servers.get(interaction.guildId).audioPlayer);
    
                    servers.get(interaction.guildId).isPlaying = true;
    
                    videos.splice(0, 1);
    
                    // console.log(localvideo.videos.length);
    
                    servers.get(interaction.guildId).queue.push(...videos);

                    servers.get(interaction.guildId).startTime = Date.now()/1000;
    
                    await interaction.editReply("```bash\nAdded the playlist: \"" + localvideo.title + "\" to the queue```");
                }

            } else if (type.includes('video')) {
                localvideo = (await video_downloader.video_info(interaction.options.getString('link-or-query'))).video_details;
                
                // If the player is currently playing a song, add this one to the queue.
                if (servers.get(interaction.guildId).isPlaying) {
                    if (localvideo) {
                        servers.get(interaction.guildId).queue.push(localvideo);

                        await interaction.editReply({embeds: [await addedToQueueEmbedBuilder(localvideo, servers.get(interaction.guildId).queue.length)]});
                        console.log(`[${interaction.guild.name}] added to queue`);
                    }
                    return;
                }
                
                // If the player isn't currently playing a song, and the video isn't null, start playing it! Otherwise, don't add anything and reply that nothing was found
                if (localvideo) {
                    // Setting the global video variable to localVideo, so we can track the currently playing video outside this function.
                    // currSongs.set(interaction.guildId, localvideo);
                    servers.get(interaction.guildId).currentSong = localvideo;
                    
                    // Downloads the video and starts to play it
                    // var currentSong = await video_downloader.stream(localvideo.url);
                    var currentSong = await video_downloader.stream(localvideo.url);
                    const currentResource = createAudioResource(currentSong.stream, {
                        inputType: currentSong.type
                    });

                    servers.get(interaction.guildId).currentStream = currentSong;
                    
                    servers.get(interaction.guildId).audioPlayer.stop();
                    servers.get(interaction.guildId).audioPlayer.play(currentResource);
                    getVoiceConnection(interaction.guildId).subscribe(servers.get(interaction.guildId).audioPlayer);

                    servers.get(interaction.guildId).isPlaying = true;

                    console.log(`[${interaction.guild.name}] playing song`);

                    // `Playing \"${video.title}\" (${video.url})`
                    await interaction.editReply({embeds: [await nowPlayingMessageBuilder(localvideo, interaction.guildId)]});
                    servers.get(interaction.guildId).startTime = Date.now()/1000;
                } else {
                    interaction.editReply('```nothing found :(```');
                    console.log(`[${interaction.guild.name}] nothing found`);
                }
            }

        // YouTube Search
        } else { 
            // console.log('got here');
            localvideo = (await video_downloader.search(interaction.options.getString('link-or-query'), {source: {youtube: "video"}, limit: 1}))[0];

            // If the player is currently playing a song, add this one to the queue.
            if (servers.get(interaction.guildId).isPlaying) {
                if (localvideo) {
                    servers.get(interaction.guildId).queue.push(localvideo);

                    await interaction.editReply({embeds: [await addedToQueueEmbedBuilder(localvideo, servers.get(interaction.guildId).queue.length)]});
                    console.log(`[${interaction.guild.name}] added to queue`);
                }
                return;
            }
            
            // If the player isn't currently playing a song, and the video isn't null, start playing it! Otherwise, don't add anything and reply that nothing was found
            if (localvideo) {
                // Setting the global video variable to localVideo, so we can track the currently playing video outside this function.
                // currSongs.set(interaction.guildId, localvideo);
                servers.get(interaction.guildId).currentSong = localvideo;
                
                // Plays the video
                // var currentSong = await video_downloader.stream(localvideo.url);
                var currentSong = await video_downloader.stream(localvideo.url);
                const currentResource = createAudioResource(currentSong.stream, {
                    inputType: currentSong.type
                });

                servers.get(interaction.guildId).currentStream = currentSong;

                // currentSong.stream.destroy();

                // console.log(localvideo.channel);
                
                servers.get(interaction.guildId).audioPlayer.stop();
                
                servers.get(interaction.guildId).audioPlayer.play(currentResource);
                getVoiceConnection(interaction.guildId).subscribe(servers.get(interaction.guildId).audioPlayer);

                servers.get(interaction.guildId).isPlaying = true;

                console.log(`[${interaction.guild.name}] playing song`);

                // `Playing \"${video.title}\" (${video.url})`
                await interaction.editReply({embeds: [await nowPlayingMessageBuilder(localvideo, interaction.guildId)]});
                servers.get(interaction.guildId).startTime = Date.now()/1000;
            } else {
                interaction.editReply('```nothing found :(```');
                console.log(`[${interaction.guild.name}] nothing found`);
            }
        }
    }

    // , async execute_defferred(interaction) {
    //     await interaction.deferReply();

    //     let file = new MessageAttachment('https://cdn.discordapp.com/emojis/397202668952748043.gif?size=160&quality=lossless');

    //     let isUrl = false;
    //     let isPlaylist = false;
    //     let isSpotify = false;

    //     // console.log(connections);
    //     // Function to find a video based on a search   
    //     const videoFinder = async (query) => {
    //         const videoResult = await ytSearch(query);
            
    //         if (isUrl) {
    //             return videoResult;
    //         }

    //         return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
    //     }

    //     // The video to be played
    //     let localvideo = null;
    //     let sp_dat = undefined;
    //     let sp_tracks = undefined;

    //     // Sets this local variable equal to either the first search result, or null if it doesn't exist
    //     if (interaction.options.getString('link-or-query').includes('http://') || interaction.options.getString('link-or-query').includes('https://')) {
    //         if (interaction.options.getString('link-or-query').includes('spotify')) {
    //             if (video_downloader.is_expired()) {
    //                 await video_downloader.refreshToken() // This will check if access token has expired or not. If yes, then refresh the token.
    //             }

    //             sp_dat = await video_downloader.spotify(interaction.options.getString('link-or-query'));
    //             sp_tracks = undefined;
    //             isSpotify = true;

    //             switch (sp_dat.type) {
    //                 case 'album':
    //                     sp_tracks = await sp_dat.all_tracks();
    //                     localvideo = new Array(sp_tracks.length);

    //                     // for (let i = 0; i < sp_tracks.length; i++) {
    //                     //     localvideo[i] = (await ytSearch(sp_tracks[i].name + " in " + sp_dat.name)).videos[0];
    //                     // }

    //                     isUrl = true;
    //                     isPlaylist = true;

    //                     break;
    //                 case 'playlist':
    //                     sp_tracks = await sp_dat.all_tracks();
    //                     localvideo = new Array(sp_tracks.length);

    //                     // for (let i = 0; i < sp_tracks.length; i++) {
    //                     //     localvideo[i] = (await ytSearch(sp_tracks[i].name + " in " + sp_tracks[i].album.name)).videos[0];
    //                     // }

    //                     isUrl = true;
    //                     isPlaylist = true;

    //                     break;
    //                 case 'track':
    //                     localvideo = (await ytSearch(sp_dat.name + " in " + sp_dat.album.name)).videos[0];

    //                     isUrl = true;
    //                     break;
    //                 default:
    //                     await interaction.channel.send('```That isn\'t a valid Spotify link, but I\'ll try searching it anyways.```');
    //                     localvideo = await videoFinder(interaction.options.getString('link-or-query'));
    //                     break;
    //             }
    //         } else if (interaction.options.getString('link-or-query').includes('list=')) {
    //             isUrl = true;
    //             isPlaylist = true;

    //             localvideo = await videoFinder({listId: interaction.options.getString('link-or-query').substring(interaction.options.getString('link-or-query').indexOf('list=') + 'list='.length, 
    //                                                                     interaction.options.getString('link-or-query').includes('&index') ? (interaction.options.getString('link-or-query').indexOf('&index')) : (interaction.options.getString('link-or-query').length) )});
    //         } else if (interaction.options.getString('link-or-query').includes('watch?v=')) {
    //             isUrl = true;
    //             // console.log('long link!');
    //                 localvideo = await videoFinder({videoId: interaction.options.getString('link-or-query').substring(interaction.options.getString('link-or-query').indexOf('watch?v=') + 'watch?v='.length, 
    //                                                                     (interaction.options.getString('link-or-query').includes('&')) ? (interaction.options.getString('link-or-query').indexOf('&')) : (interaction.options.getString('link-or-query').length) )});
    //         } else if (interaction.options.getString('link-or-query').includes('.be/')) {
    //             isUrl = true;
    //             // console.log('short link!');
    //             localvideo = await videoFinder({videoId: interaction.options.getString('link-or-query').substring(interaction.options.getString('link-or-query').indexOf('.be/') + '.be/'.length)});
    //         } else {
    //             // console.log('no link :(');
    //             await interaction.channel.send('```That isn\'t a valid YouTube or Spotify link, but I\'ll try searching it anyways.```');
    //             localvideo = await videoFinder(interaction.options.getString('link-or-query'));
    //         }
    //     } else {
    //         localvideo = await videoFinder(interaction.options.getString('link-or-query'));
    //     }

    //     // console.log(localvideo);
    //     // console.log(localvideo.videos[0].title);

    //     if (isSpotify) {
    //         if (isPlaylist) {
    //             if (localvideo.length <= 0) {
    //                 interaction.editReply('Nothing found :(');
    //                 console.log(`[${interaction.guild.name}] no spotify playlist/album found`);
    //                 return;
    //             }

    //             console.log(`[${interaction.guild.name}] Added a Spotify Playlist/Album to the queue`);

    //             if (servers.get(interaction.guildId).isPlaying) {
    //                 await interaction.editReply("```bash\nAdding a playlist, this could take a while.```");
    //                 let msg = await interaction.channel.send({files: [file]});

    //                 for (let i = 0; i < localvideo.length; i++) {
    //                     localvideo[i] = (await ytSearch(sp_tracks[i].name + " in " + sp_dat.name)).videos[0];
    //                     if (localvideo[i] == undefined) {
    //                         continue;
    //                     }
    //                     servers.get(interaction.guildId).queue.push(localvideo[i]);
    //                 }

    //                 msg.delete();
    //                 await interaction.editReply("```bash\nAdded the Spotify Playlist/Album: \"" + sp_dat.name + "\" to the queue```");
    //             } else {
    //                 await interaction.editReply("```bash\nAdding a playlist, this could take a while.```");
    //                 let msg = await interaction.channel.send({files: [file]});

    //                 while ((localvideo[0] = (await ytSearch(sp_tracks[0].name + " in " + sp_dat.name)).videos[0]) == undefined) {
    //                     localvideo.splice(0, 1);
    //                     sp_tracks.splice(0, 1); 
    //                 }

    //                 currSongs.set(interaction.guildId, localvideo[0]);

    //                 const currentSong = await video_downloader.stream(localvideo[0].url);
                    
    //                 const currentResource = createAudioResource(currentSong.stream, {
    //                     inputType: currentSong.type
    //                 });

    //                 servers.get(interaction.guildId).audioPlayer.stop();
    //                 servers.get(interaction.guildId).audioPlayer.play(currentResource);
    //                 getVoiceConnection(interaction.guildId).subscribe(players.get(interaction.guildId));
    //                 servers.get(interaction.guildId).isPlaying = true;

    //                 localvideo.splice(0, 1);
    //                 sp_tracks.splice(0, 1);

    //                 for (let i = 0; i < localvideo.length; i++) {
    //                     localvideo[i] = (await ytSearch(sp_tracks[i].name + " in " + sp_dat.name)).videos[0];
    //                     if (localvideo[i] == undefined) {
    //                         continue;
    //                     }
    //                     queues.get(interaction.guildId).push(localvideo[i]);
    //                 }

    //                 msg.delete();
    //                 await interaction.editReply("```bash\nAdded the Spotify Playlist/Album: \"" + sp_dat.name + "\" to the queue```");
    //             }
    //         } else {
    //             if (servers.get(interaction.guildId).isPlaying) {
    //                 if (localvideo == undefined) {
    //                     await interaction.editReply("```bash\nCouldn't find the Spotify Song on YouTube.```");
    //                     console.log(`[${interaction.guild.name}] could not find Spotify song.`);
    //                     return;
    //                 }
    //                 queues.get(interaction.guildId).push(localvideo);
    //                 await interaction.editReply({embeds: [await addedToQueueEmbedBuilder(localvideo, queues.get(interaction.guildId).length)]});
    //                 console.log(`[${interaction.guild.name}] from Spotify added to queue`);
    //             } else {
    //                 if (localvideo) {
    //                     if (localvideo == undefined) {
    //                         await interaction.editReply("```bash\nCouldn't find the Spotify Song on YouTube.```");
    //                         console.log(`[${interaction.guild.name}] could not find Spotify song.`);
    //                         return;
    //                     }

    //                     // Setting the global video variable to localVideo, so we can track the currently playing video outside this function.
    //                     currSongs.set(interaction.guildId, localvideo);
                        
    //                     // Downloads the video and starts to play it
    //                     // var currentSong = await video_downloader.stream(localvideo.url);
    //                     var currentSong = await video_downloader.stream(localvideo.url);
    //                     const currentResource = createAudioResource(currentSong.stream, {
    //                         inputType: currentSong.type
    //                     });
                        
    //                     players.get(interaction.guildId).stop();
    //                     players.get(interaction.guildId).play(currentResource);
    //                     getVoiceConnection(interaction.guildId).subscribe(players.get(interaction.guildId));

    //                     servers.get(interaction.guildId).isPlaying = true;

    //                     console.log(`[${interaction.guild.name}] playing Spotify song`);

    //                     // `Playing \"${video.title}\" (${video.url})`
    //                     await interaction.editReply({embeds: [await nowPlayingMessageBuilder(localvideo, interaction.guildId)]});
    //                 } else {
    //                     interaction.editReply('nothing found :(');
    //                     console.log(`[${interaction.guild.name}] nothing found`);
    //                 }
    //             }
    //         }

    //         startTimes.set(interaction.guildId, Date.now()/1000);

    //         return;
    //     }

    //     if (isPlaylist) {
    //         let videos = [];
    //         videos = localvideo.videos;

    //         if (videos.length <= 0) {
    //             interaction.editReply('Nothing found :(');
    //             console.log(`[${interaction.guild.name}] no playlist found`);
    //             return;
    //         }

    //         console.log(`[${interaction.guild.name}] Added a playlist to the queue`);

    //         if (servers.get(interaction.guildId).isPlaying) {
    //             await interaction.editReply("```bash\nAdding a playlist, this could take a while.```");
    //             let msg = await interaction.channel.send({files: [file]});

    //             for (let i = 0; i < videos.length; i++) {
    //                 let video = await videoFinder({videoId: videos[i].videoId});
    //                 queues.get(interaction.guildId).push(video);
    //             }

    //             msg.delete();
    //             await interaction.editReply("```bash\nAdded the playlist: \"" + localvideo.title + "\" to the queue```");
    //         } else {
    //             await interaction.editReply("```bash\nAdding a playlist, this could take a while.```");
    //             let msg = await interaction.channel.send({files: [file]});

    //             let video = await videoFinder({videoId: videos[0].videoId});
    //             currSongs.set(interaction.guildId, video);

    //             // var currentSong = await video_downloader.stream(video.url);
    //             var currentSong = await video_downloader.stream(video.url);
    //             const currentResource = createAudioResource(currentSong.stream, {
    //                 inputType: currentSong.type
    //             });

    //             players.get(interaction.guildId).stop();
    //             players.get(interaction.guildId).play(currentResource);
    //             getVoiceConnection(interaction.guildId).subscribe(players.get(interaction.guildId));

    //             servers.get(interaction.guildId).isPlaying = true;

    //             videos.splice(0, 1);

    //             // console.log(localvideo.videos.length);

    //             for (let i = 0; i < videos.length; i++) {
    //                 video = await videoFinder({videoId: videos[i].videoId});
    //                 queues.get(interaction.guildId).push(video);
    //             }

    //             msg.delete();
    //             await interaction.editReply("```bash\nAdded the playlist: \"" + localvideo.title + "\" to the queue```");
    //         }

    //         startTimes.set(interaction.guildId, Date.now()/1000);

    //         return;
    //     }

    //     // If the player is currently playing a song, add this one to the queue.
    //     if (servers.get(interaction.guildId).isPlaying) {
    //         if (localvideo) {
    //             queues.get(interaction.guildId).push(localvideo);

    //             await interaction.editReply({embeds: [await addedToQueueEmbedBuilder(localvideo, queues.get(interaction.guildId).length)]});
    //             console.log(`[${interaction.guild.name}] added to queue`);
    //         }
    //         return;
    //     }
        
    //     // If the player isn't currently playing a song, and the video isn't null, start playing it! Otherwise, don't add anything and reply that nothing was found
    //     if (localvideo) {
    //         // Setting the global video variable to localVideo, so we can track the currently playing video outside this function.
    //         currSongs.set(interaction.guildId, localvideo);
            
    //         // Downloads the video and starts to play it
    //         // var currentSong = await video_downloader.stream(localvideo.url);
    //         var currentSong = await video_downloader.stream(localvideo.url);
    //         const currentResource = createAudioResource(currentSong.stream, {
    //             inputType: currentSong.type
    //         });
            
    //         players.get(interaction.guildId).stop();
    //         players.get(interaction.guildId).play(currentResource);
    //         getVoiceConnection(interaction.guildId).subscribe(players.get(interaction.guildId));

    //         servers.get(interaction.guildId).isPlaying = true;

    //         console.log(`[${interaction.guild.name}] playing song`);

    //         // `Playing \"${video.title}\" (${video.url})`
    //         await interaction.editReply({embeds: [await nowPlayingMessageBuilder(localvideo, interaction.guildId)]});
    //         startTimes.set(interaction.guildId, Date.now()/1000);
    //     } else {
    //         interaction.editReply('nothing found :(');
    //         console.log(`[${interaction.guild.name}] nothing found`);
    //     }
    // },
};

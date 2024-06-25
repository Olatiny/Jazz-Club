const fs = require('fs');
const { Client, Intents, Collection, Interaction, InteractionCollector, MessageEmbed } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection } = require('@discordjs/voice');
const { token } = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const video_downloader = require('play-dl');
const ytSearch = require('yt-search');

video_downloader.getFreeClientID().then((clientId) => video_downloader.setToken({
    soundcloud : {
        client_id : clientId
    }
}));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// let { queues, players, playing, repeating, currSongs, hasListener, hasDisconnected, disconnectTimers, queueButtons, queueMessages, startTimes, funkyMode, funkyTimeout} = require('./globals.js');
let {servers, Server, queueButtons} = require('./globals.js');
let funky_files = fs.readdirSync('./funky mode/').filter(file => file.endsWith('.mp3'));
let happy_kong = 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/5a0f0164-95c2-443f-a625-2ec658a321de/dciq33q-436b23f0-5f84-45a1-aa9e-ff55e597a67a.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzVhMGYwMTY0LTk1YzItNDQzZi1hNjI1LTJlYzY1OGEzMjFkZVwvZGNpcTMzcS00MzZiMjNmMC01Zjg0LTQ1YTEtYWE5ZS1mZjU1ZTU5N2E2N2EuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.09XYyyt___FDO8-QpsnAR3JT0pzxJ-9kFVCPm9Xqsv8';

let addListener = function(interaction) {
    if (!servers.get(interaction.guildId).hasListener) {
        getVoiceConnection(interaction.guildId).on('stateChange', (oldState, newState) => {
            const oldNetworking = Reflect.get(oldState, 'networking');
            const newNetworking = Reflect.get(newState, 'networking');
          
            const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
              const newUdp = Reflect.get(newNetworkState, 'udp');
              clearInterval(newUdp?.keepAliveInterval);
            }
          
            oldNetworking?.off('stateChange', networkStateChangeHandler);
            newNetworking?.on('stateChange', networkStateChangeHandler);
        });

        getVoiceConnection(interaction.guildId).on(VoiceConnectionStatus.Disconnected, async () => {
            if (!servers.get(interaction.guildId).hasDisconnected) {
                await interaction.channel.send("```Disconnecting from voice connection and clearing the queue.```");

                servers.get(interaction.guildId).disconnect();
                servers.set(interaction.guildId, null);
                servers.delete(interaction.guildId);
        
                console.log(`[${interaction.guild.name}] Stopping the player`);
            }
            // hasDisconnected.set(interaction.guildId, false);
        });

        /** Whenever there is an error, print to console.error and reset the bot */
        servers.get(interaction.guildId).audioPlayer.on('error', async error => {
            if (!servers.get(interaction.guildId).hasDisconnected) {
                console.error('Error:', error.message, 'with track', error.resource);
                console.error(`in [${interaction.guild.name}]`);

                servers.get(interaction.guildId).disconnect();
                servers.set(interaction.guildId, null);
                servers.delete(interaction.guildId);
        
                interaction.channel.send("```An error occured with the audio player, so I had to reset the queue```");
            }
            // hasDisconnected.set(interaction.guildId, false);
        });

        servers.get(interaction.guildId).audioPlayer.on(AudioPlayerStatus.Idle, async () => {

            /**
             * Funky Mode
             */
            if (servers.get(interaction.guildId).funkyMode) {
                if (!servers.get(interaction.guildId).funkyTimeout) {
                    servers.get(interaction.guildId).funkyTimeout = true;
                    // console.log(`[${interaction.guild.name}] Funky Timeout Started`)
                    // console.log(funky_files);

                    setTimeout(() => {
                        if (!servers.get(interaction.guildId).funkyMode) return;

                        let funky_effect = funky_files[parseInt(Math.random() * funky_files.length)];

                        if (funky_effect.includes("RickRoll")) {
                            if (funky_effect.includes("nice")) {
                                if (Math.random() * 10 < 5) {
                                    console.log("evaded rick roll (nice)");
                                    funky_effect = funky_files[parseInt(Math.random() * funky_files.length)];
                                } 
                            }
                            if (funky_effect.includes("mean")) {
                                if (Math.random() * 10 < 9) {
                                    console.log("evaded rick roll (mean)");
                                    funky_effect = funky_files[parseInt(Math.random() * funky_files.length)]; 
                                }
                            }
                        }

                        let funky_resource = createAudioResource(`./funky mode/${funky_effect}`);

                        servers.get(interaction.guildId).audioPlayer.play(funky_resource);

                        servers.get(interaction.guildId).funkyTimeout = false;
                        
                        console.log(`[${interaction.guild.name}] Funky ${funky_effect}!`);
                    }, (Math.random() * 180 + 180) * 1000);
                }

                return;
            } 

            /**
             * Normal mode
             */
            if (servers.get(interaction.guildId).repeating && servers.get(interaction.guildId).isPlaying) {
                //console.log("in on event" + servers.get(interaction.guildId).currentSong.title);
                var currentSong = await video_downloader.stream(servers.get(interaction.guildId).currentSong.url);
                const currentResource = createAudioResource(currentSong.stream, {
                    inputType: currentSong.type
                });

                servers.get(interaction.guildId).currentStream.stream.destroy();
                servers.get(interaction.guildId).currentStream = currentSong;

                servers.get(interaction.guildId).audioPlayer.pause();
                servers.get(interaction.guildId).audioPlayer.play(currentResource);
                //console.log(servers.get(interaction.guildId).audioPlayer.state);
                console.log(`[${interaction.guild.name}] repeating`);
                // startTimes.set(interaction.guildId, Date.now()/1000);
                servers.get(interaction.guildId).startTime = Date.now()/1000;
            } else if (servers.get(interaction.guildId).isPlaying) {
                if (servers.get(interaction.guildId).queue.length > 0) {
                    // await interaction.channel.send(servers.get(interaction.guildId).queue[0].url);
                    // await interaction.channel.send(`\`\`\`bash\nNow playing: "${servers.get(interaction.guildId).queue[0].title}"\`\`\``);
                    var currentsong = undefined;

                    while (servers.get(interaction.guildId).queue[0] == undefined) {
                        servers.get(interaction.guildId).queue.splice(0, 1);
                    }

                    servers.get(interaction.guildId).audioPlayer.pause();

                    let vid = servers.get(interaction.guildId).queue[0]

                    let type = await video_downloader.validate(servers.get(interaction.guildId).queue[0].url);

                    if (type.startsWith('sp')) {
                        while ((servers.get(interaction.guildId).queue[0] = (await ytSearch(vid.artist + ", " + vid.name + " in " + vid.list)).videos[0]) == undefined) {
                            servers.get(interaction.guildId).queue.splice(0, 1);
                        };
                    }

                    currentSong = await video_downloader.stream(servers.get(interaction.guildId).queue[0].url);
                    const currentResource = createAudioResource(currentSong.stream, {
                        inputType: currentSong.type
                    });

                    servers.get(interaction.guildId).currentStream.stream.destroy();
                    servers.get(interaction.guildId).currentStream = currentSong;

                    servers.get(interaction.guildId).currentSong = servers.get(interaction.guildId).queue[0];
                    // currSongs.set(interaction.guildId, servers.get(interaction.guildId).queue[0]);
                    servers.get(interaction.guildId).queue.splice(0, 1);
                    servers.get(interaction.guildId).audioPlayer.play(currentResource);
    
                    console.log(`[${interaction.guild.name}] playing next song`);
                    servers.get(interaction.guildId).startTime = Date.now()/1000;
                    // startTimes.set(interaction.guildId, Date.now()/1000);
                } else {
                    servers.get(interaction.guildId).isPlaying = false;

                    servers.get(interaction.guildId).currentSong = null;

                    // Somewhere so that it's in an accessible scope
                    let timeoutID;

                    console.log(`[${interaction.guild.name}] Idling.`);

                    // After the queue has ended
                    timeoutID = setTimeout(async () => {
                        if (!getVoiceConnection(interaction.guildId)) {
                            return;
                        }

                        if (!servers.get(interaction.guildId).isPlaying) {
                            servers.get(interaction.guildId).disconnect();
                            servers.set(interaction.guildId, null);
                            servers.delete(interaction.guildId);
                            
                            await interaction.channel.send("```\nYou didn't queue anything up for a while, so I left.```");
                            console.log(`[${interaction.guild.name}] Timed out, so bot left.`);
                        } else {
                            console.log(interaction.guild.name + "Did not time out.");
                        }
                    }, 15 * 60 * 1000); // You should use the time in ms

                    servers.get(interaction.guildId).disconnectTimer = timeoutID;

                    servers.get(interaction.guildId).audioPlayer.stop();

                    console.log(`[${interaction.guild.name}] Stopping the player`);
                }
            } else {        
                servers.get(interaction.guildId).isPlaying = false;

                servers.get(interaction.guildId).currentSong = null;

                // Somewhere so that it's in an accessible scope
                let timeoutID;

                console.log(`[${interaction.guild.name}] Idling.`);

                // After the queue has ended
                timeoutID = setTimeout(async () => {
                    if (!getVoiceConnection(interaction.guildId)) {
                        return;
                    }

                    if (!servers.get(interaction.guildId).isPlaying) {
                        servers.get(interaction.guildId).disconnect();
                        servers.set(interaction.guildId, null);
                        servers.delete(interaction.guildId);
                                                
                        await interaction.channel.send("```\nYou didn't queue anything up for a while, so I left.```");
                        console.log(`[${interaction.guild.name}] Timed out, so bot left.`);
                    } else {
                        console.log(interaction.guild.name + "Did not time out.");
                    }
                }, 15 * 60 * 1000); // You should use the time in ms

                servers.get(interaction.guildId).disconnectTimer = timeoutID;

                servers.get(interaction.guildId).audioPlayer.stop();

                console.log(`[${interaction.guild.name}] Stopping the player`);
            }
        });
        
        servers.get(interaction.guildId).hasListener = true;
    }
}

//queues, connections, players, playing, repeating, currSongs, hasListener, hasDisconnected, disconnectTimers, queueButtons, queueMessages, startTimes

// client.addEventListener("int")
// client.addListener("interactionCreate", async interaction => {
//     interaction.reply("hi");
// });

client.on("interactionCreate", async interaction => {
    if (servers.get(interaction.guildId)) {
        clearTimeout(servers.get(interaction.guildId).disconnectTimer);
        servers.get(interaction.guildId).disconnectTimer = null;    
    }
    
    // console.log(disconnectTimers.entries());

    //For use by queue printout, allows to alternate between pages
    try {
        if (interaction.isButton()) {
            let id = interaction.customId;
    
            let pages = servers.get(interaction.guildId).queueMessage.pgs;
            let idx = servers.get(interaction.guildId).queueMessage.idx;
    
            switch(id) {
                case 'prev':
                    if (idx - 1 < 0) {
                        servers.get(interaction.guildId).queueMessage.idx = pages.length - 1;
                    } else {
                        servers.get(interaction.guildId).queueMessage.idx--;
                    }
                    interaction.update({content: pages[servers.get(interaction.guildId).queueMessage.idx].toString(), components: [queueButtons]});
                    break;
                case 'next':
                    if (idx + 1 >= pages.length) {
                        servers.get(interaction.guildId).queueMessage.idx = 0;
                    } else {
                        servers.get(interaction.guildId).queueMessage.idx++;
                    }
                    interaction.update({content: pages[servers.get(interaction.guildId).queueMessage.idx].toString(), components: [queueButtons]});
                    break;
                default:
                    break;
            }
    
            // console.log(idx);
        }    
    } catch (err) {
        // Just let it time out
    }

    if (!interaction.isCommand()) return;
    
    const command = client.commands.get(interaction.commandName);

    if (!command) return;
    
    let voice_id = interaction.guild.members.cache.get(interaction.member.user.id).voice.channelId;
    let guild_id = interaction.guildId;

    if (interaction.commandName === 'roll' || interaction.commandName === 'programmer' || interaction.commandName === 'kumi' || interaction.commandName === 'excuses') {
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
    
            if (interaction.replied) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
        return;
    }

    // If the user isn't in a voice channel, don't join the bot
    if (!voice_id) {
        return interaction.reply("```You must be in a voice channel to do that!```");
    }

    if (!getVoiceConnection(interaction.guildId)) {
        // Creating voice connection
        let connection = joinVoiceChannel({
            channelId: voice_id,
            guildId: guild_id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        servers.set(guild_id, new Server(guild_id));

        // connections.set(guild_id, connection);
        // queues.set(guild_id, []);
        // players.set(guild_id, createAudioPlayer());
        // playing.set(guild_id, false);
        // repeating.set(guild_id, false);
        // playing.set(guild_id, null);
        // hasDisconnected.set(guild_id, false);
    }

    addListener(interaction);

    if (interaction.commandName === 'funky-mode') {
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
    
            if (interaction.replied) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }

        return;
    }
    
    if (servers.get(interaction.guildId).funkyMode) {
            const embed = new MessageEmbed()
                .setTitle('You are in `Funky Mode`:')
                .setColor('#b91c50')
                .setImage(happy_kong);    

        await interaction.reply({embeds: [embed]});
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);

        if (interaction.replied) {
            await interaction.followUp({ content: `\`\`\`There was an error while executing this command! ${error.toString().includes('404') ? "The link you gave me doesn't exist (404)." : ""}\`\`\``, ephemeral: true });
        } else {
            if (interaction.deferred) {
                await interaction.editReply({ content: `\`\`\`There was an error while executing this command! ${error.toString().includes('404') ? "The link you gave me doesn't exist (404)." : ""}\`\`\``, ephemeral: true });
            } else {
                await interaction.reply({ content: `\`\`\`There was an error while executing this command! ${error.toString().includes('404') ? "The link you gave me doesn't exist (404)." : ""}\`\`\``, ephemeral: true });
            }
        }
    }
});

/** Runs once, lets the user know the bot is online */
client.once('ready', () => {
    console.log('Ready!');
    client.user.setPresence({activities: [{name: "Music", type: "PLAYING"}]});
});

client.login(token);
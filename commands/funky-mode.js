const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioResource, getVoiceConnection, AudioResource } = require('@discordjs/voice');
const { MessageAttachment, MessageEmbed } = require('discord.js');
const fs = require('fs');

const video_downloader = require('play-dl');
// const ytSearch = require('yt-search');

// let {queues, players, playing, currSongs, startTimes, nowPlayingMessageBuilder, addedToQueueEmbedBuilder, funkyMode, funkyTimeout} = require('../globals.js');
let {servers, Server, nowPlayingMessageBuilder, addedToQueueEmbedBuilder} = require('../globals.js');

video_downloader.getFreeClientID().then((clientId) => video_downloader.setToken({
    soundcloud : {
        client_id : clientId
    }
}));

let funky_files = fs.readdirSync('./funky mode/').filter(file => file.endsWith('.mp3'));

let happy_kong = 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/5a0f0164-95c2-443f-a625-2ec658a321de/dciq33q-436b23f0-5f84-45a1-aa9e-ff55e597a67a.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzVhMGYwMTY0LTk1YzItNDQzZi1hNjI1LTJlYzY1OGEzMjFkZVwvZGNpcTMzcS00MzZiMjNmMC01Zjg0LTQ1YTEtYWE5ZS1mZjU1ZTU5N2E2N2EuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.09XYyyt___FDO8-QpsnAR3JT0pzxJ-9kFVCPm9Xqsv8';
let sad_kong = 'http://www.reactiongifs.com/r/dc41.gif';

module.exports = {
    data: new SlashCommandBuilder().setName('funky-mode')
        .setDescription('Toggles Funky Mode'),
    async execute(interaction) {
        await interaction.deferReply();

        let funkyMode = servers.get(interaction.guildId).funkyMode;

        // enabling funky mode
        if (!funkyMode) {
            servers.get(interaction.guildId).funkyMode = true;

            let resource = createAudioResource("./funky mode/p5-cutin.mp3");

            // console.log(players.get(interaction.guildId));
            // console.log(resource);

            servers.get(interaction.guildId).audioPlayer.stop();
            servers.get(interaction.guildId).audioPlayer.play(resource);
            getVoiceConnection(interaction.guildId).subscribe(servers.get(interaction.guildId).audioPlayer);

            // const attachment = new MessageAttachment(happy_kong);

            const embed = new MessageEmbed()
                .setTitle('Now entering `Funky Mode`:')
                .setColor('#b91c50')
                .setImage(happy_kong);    

            await interaction.editReply({embeds: [embed]});
            console.log(`[${interaction.guild.name}] Entered Funky Mode`)

        // disabling funky mode
        } else {
            servers.get(interaction.guildId).funkyMode = false;
            servers.get(interaction.guildId).audioPlayer.stop();
            servers.get(interaction.guildId).funkyTimeout = false;

            if (servers.get(interaction.guildId).currentSong) {
                var currentSong = await video_downloader.stream(servers.get(interaction.guildId).currentSong.url);
                const currentResource = createAudioResource(currentSong.stream, {
                    inputType: currentSong.type
                });
    
                servers.get(interaction.guildId).audioPlayer.play(currentResource);
    
                servers.get(interaction.guildId).startTime = Date.now() / 1000;    
            }

            const embed = new MessageEmbed()
                .setTitle('Now leaving `Funky Mode`:')
                .setColor('#b91c50')
                .setImage(sad_kong);    

            await interaction.editReply({embeds: [embed]});
            console.log(`[${interaction.guild.name}] Exited Funky Mode`)

        }
    }
};

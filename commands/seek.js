const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioResource } = require('@discordjs/voice');
const { MessageEmbed, Interaction, CommandInteraction } = require('discord.js');
let {servers} = require('../globals.js');
const play_dl = require('play-dl');


module.exports = {
    data: new SlashCommandBuilder().setName('seek')
        .setDescription('Seek to a specified position in the song currently playing')
        .addStringOption(option =>
            option.setName('timestamp')
                .setDescription('The time-stamp of the position you seek. (Format HH:MM:SS)')
                .setRequired(true)),
                /**
                 * 
                 * @param {CommandInteraction} interaction 
                 * @returns 
                 */
        async execute(interaction) {
            /**
             * @type {String}
             */
            let input = interaction.options.getString('timestamp');

            let time_s = 0;

            // Only seconds
            if (input.length <= 2) {
                console.log('only seconds');
                // Check if valid number
                if (isNaN(input)) {
                    await interaction.reply({ content: "```Incorrect format. Please use (HH:MM:SS)```", ephemeral: true });
                    return;
                }

                if (Number(input) > 59) {
                    await interaction.reply({ content: "```There are only 0-59 seconds in a minute. Please use (HH:MM:SS)```", ephemeral: true });
                    return;
                }

                time_s += Number(input);
            }

            // Seconds and Minutes
            else if (input.length <= 5) {
                console.log('seconds and minutes');
                let timeArray = input.split(':');
                
                if (isNaN(timeArray[0]) || isNaN(timeArray[1])) {
                    await interaction.reply({ content: "```Incorrect format. Please use (HH:MM:SS)```", ephemeral: true });
                    return;
                }

                if (timeArray[0] > 59) {
                    await interaction.reply({ content: "```There are only 0-59 minutes in an hour. Please use (HH:MM:SS)```", ephemeral: true });
                    return;
                }

                if (timeArray[1] > 59) {
                    await interaction.reply({ content: "```There are only 0-59 seconds in a minute. Please use (HH:MM:SS)```", ephemeral: true });
                    return;
                }

                time_s += Number(timeArray[0]) * 60 + Number(timeArray[1]);
            }

            // Seconds, Minutes, and Hours
            else if (input.length <= 8) {
                console.log('seconds, minutes, and hours');
                let timeArray = input.split(':');

                if (isNaN(timeArray[0]) || isNaN(timeArray[1]) || isNaN(timeArray[2])) {
                    await interaction.reply({ content: "```Incorrect format. Please use (HH:MM:SS)```", ephemeral: true });
                    return;
                }

                if (timeArray[0] > 23) {
                    await interaction.reply({ content: "```There are only 0-23 hours in a day. Please use (HH:MM:SS)```", ephemeral: true });
                    return;
                }

                if (timeArray[1] > 59) {
                    await interaction.reply({ content: "```There are only 0-59 minutes in an hour. Please use (HH:MM:SS)```", ephemeral: true });
                    return;
                }

                if (timeArray[2] > 59) {
                    await interaction.reply({ content: "```There are only 0-59 seconds in a minute. Please use (HH:MM:SS)```", ephemeral: true });
                    return;
                }

                time_s += Number(timeArray[0]) * 60 * 60 + Number(timeArray[1]) * 60 + Number(timeArray[2]);
            }

            // console.log(time_s);

            // await interaction.reply(`The time in MS you are seeking to is: ${time_s}`);
            try {
                var currentSong = await play_dl.stream(servers.get(interaction.guildId).currentSong.url, {seek: time_s});
                const resource = createAudioResource(currentSong.stream, {
                    inputType: currentSong.type
                });

                servers.get(interaction.guildId).currentStream.stream.destroy();
                servers.get(interaction.guildId).currentStream = currentSong;
                
                servers.get(interaction.guildId).audioPlayer.stop();
                servers.get(interaction.guildId).audioPlayer.play(resource);
                await interaction.reply({ content: `\`\`\`Seeked to ${input} in the current song.\`\`\``, ephemeral: false });
            } catch (err) {
                if (servers.get(interaction.guildId).isPlaying) {
                    await interaction.reply({ content: "```Time out of range for video. Please make sure the timestamp is valid for the video first.```", ephemeral: true });
                } else {
                    await interaction.reply({ content: "```Nothing is even playing right now.```", ephemeral: true }); 
                }
            }
        }
}

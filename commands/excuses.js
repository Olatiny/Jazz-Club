const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const fs = require('fs');
// let {players, currSongs} = require('../globals.js');

module.exports = {
    data: new SlashCommandBuilder().setName('excuses')
	    .setDescription('Gives you an excuse. You know what you did.'),
    async execute(interaction) {
        await interaction.deferReply();

        const commandFiles = fs.readdirSync('./Excuses/').filter(file => file.endsWith('.gif'));

        let index = parseInt(Math.random()*commandFiles.length);
        
        const attachment = new MessageAttachment(`./Excuses/${commandFiles[index]}`);

        const embed = new MessageEmbed()
            .setTitle('My excuse:')
            .setColor('#b91c50')
            .setImage(`attachment://${commandFiles[index]}`);

        await interaction.editReply({embeds: [embed], files: [attachment]});
    }
}
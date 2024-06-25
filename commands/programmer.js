const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder().setName('programmer')
        .setDescription('Sends an image of a random programmer'),
    async execute(interaction) {
        await interaction.deferReply();

        const commandFiles = fs.readdirSync('./Programming-Girls/').filter(file => file.endsWith('.png'));

        let index = parseInt(Math.random()*commandFiles.length);
        
        const attachment = new MessageAttachment(`./Programming-Girls/${commandFiles[index]}`);

        const embed = new MessageEmbed()
            .setTitle('Found your programmer:')
            .setColor('#b91c50')
            .setImage(`attachment://${commandFiles[index]}`);

        await interaction.editReply({embeds: [embed], files: [attachment]});
    }
}
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('roll')
        .setDescription('Roll some dice!')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of dice you wish to roll')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of dice you wish to roll')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('modifier')
                .setDescription('Any modifier that may apply to your roll')
                .setRequired(false)),
        async execute(interaction) {
            let amount = interaction.options.getInteger('amount');

            if (amount <= 0) {
                await interaction.reply({content: `\`\`\`You can\'t roll ${(amount < 0) ? ('negative') : ('no')} dice, you fool!\`\`\``, ephemeral: true});
                return;
            }

            let rolls = new Array(amount);

            let input = interaction.options.getString('type');

            if (input.length < 2) {
                await interaction.reply({content: '```Dice must be input in the format: d<number>.```', ephemeral: true});
                return;
            } else {
                if (input.charAt(0) != 'd') {
                    await interaction.reply({content: '```Dice must be input in the format: d<number>.```', ephemeral: true});
                    return;
                }
                if (isNaN(Number(input.substring(1)))) {
                    await interaction.reply({content: '```Dice must be input in the format: d<number>.```', ephemeral: true});
                    return;
                }
            }

            let max = Number(input.substring(1));

            // console.log(input.substring(1));

            if (max < 2) {
                await interaction.reply({content: `\`\`\`You have to roll at least a d2.\`\`\``, ephemeral: true});
                return;
            }

            // console.log(max);

            for (var i = 0; i < rolls.length; i++) {
                rolls[i] = parseInt(Math.random()*max) + 1;
            }

            let modifier_string = interaction.options.getString('modifier');
            let modifier = 0;

            if (!isNaN(Number(modifier_string))) {
                modifier = Number(modifier_string)
            } else {
                await interaction.reply({content: '```Your modifier must be a real number!```', ephemeral: true});
                return;
            }

            rolls.sort((a, b) => b - a);

            let message = "["
            let result = 0;
            for (var i = 0; i < rolls.length; i++) {
                result += rolls[i];
                
                if (rolls[i] == max) message += "**";
                message += rolls[i];
                if (rolls[i] == max) message += "**";

                if (i < rolls.length - 1) {
                    message += " + "
                }
            }

            result += modifier;

            if (modifier != 0) {
                message += `] ${(modifier > 0) ? (`+ ${modifier}`) : (`- ${Math.abs(modifier)}`)} = ` + result + "";
            } else {
                message += `] = ` + result + "";
            }

            let embed = new MessageEmbed().addField(`rolling ${amount}${input}:`, message);

            // await interaction.reply(`${interaction.user} rolled ${amount}${input}: ${message}`);
            await interaction.reply({embeds: [embed]});
        }
}

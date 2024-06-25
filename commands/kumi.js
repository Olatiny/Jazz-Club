const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder().setName('kumi')
        .setDescription('Kumi commits war crimes and attempts annihilation')
        .addStringOption(option =>
            option.setName('critical')
                .setDescription('Did you land a critical hit?')
                .setRequired(true)
                .addChoices(
                    {name: 'yes', value: 'yes'},
                    {name: 'no', value: 'no'},
                ))
        .addStringOption(option =>
            option.setName('booming-blade')
                .setDescription('Did you use booming blade?')
                .setRequired(true)
                .addChoices(
                    {name: 'yes', value: 'yes'},
                    {name: 'no', value: 'no'},
                ))
        .addStringOption(option =>
            option.setName('psychic-whispers')
                .setDescription('Did you use psychic whispers?')
                .setRequired(true)
                .addChoices(
                    {name: 'yes', value: 'yes'},
                    {name: 'no', value: 'no'},
                ))
        .addStringOption(option =>
            option.setName('hex')
                .setDescription('Did you use hex?')
                .setRequired(true)
                .addChoices(
                    {name: 'yes', value: 'yes'},
                    {name: 'no', value: 'no'},
                ))
        .addStringOption(option =>
            option.setName('hexblade-curse')
                .setDescription('Did you use hexblade\'s curse?')
                .setRequired(true)
                .addChoices(
                    {name: 'yes', value: 'yes'},
                    {name: 'no', value: 'no'},
                ))
        .addStringOption(option =>
            option.setName('doraiba')
                .setDescription('Did you use doraiba?')
                .setRequired(true)
                .addChoices(
                    {name: 'yes', value: 'yes'},
                    {name: 'no', value: 'no'},
                )),
    async execute(interaction) {
        await interaction.deferReply();

        let message = "```Kumi annihilates the enemy with:\n2d8: [";
        let total = 0;
        let subtotal = 0
        let bonus = 0;

        let critical = interaction.options.getString('critical') == 'yes';
        let boom = interaction.options.getString('booming-blade') == 'yes';
        let psychic = interaction.options.getString('psychic-whispers') == 'yes';
        let hex = interaction.options.getString('hex') == 'yes';
        let curse = interaction.options.getString('hexblade-curse') == 'yes';
        let doraiba = interaction.options.getString('doraiba') == 'yes';

        for (let i = 0; i < 2; i++) {
            let temp = parseInt(Math.random()*8) + 1;
            message += temp;
            total += temp;
            subtotal += temp;
            bonus += 8;
            
            if (i != 1)
                message += " + ";
            else
                message += `] = ${subtotal}\n`;
        }

        subtotal = 0;
        
        if (critical) {
            message += "5d6: [";

            for (let i = 0; i < 5; i++) {
                let temp = parseInt(Math.random()*6) + 1;
                message += temp;
                total += temp;
                subtotal += temp;
                bonus += 6;
                
                if (i != 4)
                    message += " + ";
                else
                    message += `] = ${subtotal}\n`;
            }

            subtotal = 0;
        }

        if (boom) {
            message += "3d8: [";

            for (let i = 0; i < 3; i++) {
                let temp = parseInt(Math.random()*8) + 1;
                message += temp;
                total += temp;
                subtotal += temp;
                bonus += 8;
                
                if (i != 2)
                    message += " + ";
                else
                    message += `] = ${subtotal}\n`;
            }

            subtotal = 0;
        }

        if (psychic) {
            message += "8d6: [";

            for (let i = 0; i < 8; i++) {
                let temp = parseInt(Math.random()*6) + 1;
                message += temp;
                total += temp;
                subtotal += temp;
                bonus += 6;
                
                if (i != 7)
                    message += " + ";
                else
                    message += `] = ${subtotal}\n`;
            }

            subtotal = 0;
        }

        if (hex) {
            message += "1d6: [";

            let temp = parseInt(Math.random()*6) + 1;
            message += temp;
            total += temp;
            bonus += 6;
            message += `] = ${temp}\n`;
        }

        if (doraiba) {
            message += "4d6: [";

            for (let i = 0; i < 4; i++) {
                let temp = parseInt(Math.random()*6) + 1;
                message += temp;
                total += temp;
                subtotal += temp;
                bonus += 6;
                
                if (i != 3)
                    message += " + ";
                else
                    message += `] = ${subtotal}\n`;
            }

            subtotal = 0;
        }

        if (curse) {
            message += "+ 12 (curse + war)\n";
            total += 12;
        } else {
            message += "+ 6 (war)";
            total += 6;
        }

        if (critical) {
            total += bonus;
            message += `+ ${bonus} for the CRIT`;
        } else {
            message = message.substring(0, message.length - 1);
        }

        message += `\`\`\`for a total of: ***${total} DAMAGE***`;

        await interaction.editReply(message);
    }
}

/*
        let message = "```Kumi slaughters the enemy with:\n2d8: [";
        let total = 0;
        let subtotal = 0

        for (let i = 0; i < 2; i++) {
            let temp = parseInt(Math.random()*8) + 1;
            message += temp;
            total += temp;
            subtotal += temp;
            
            if (i != 1)
                message += " + ";
            else
                message += `] = ${subtotal}\n`;
        }

        subtotal = 0;
        message += "3d8: [";

        for (let i = 0; i < 3; i++) {
            let temp = parseInt(Math.random()*8) + 1;
            message += temp;
            total += temp;
            subtotal += temp;
            
            if (i != 2)
                message += " + ";
            else
                message += `] = ${subtotal}\n`;
        }

        subtotal = 0;
        message += "8d6: [";

        for (let i = 0; i < 8; i++) {
            let temp = parseInt(Math.random()*6) + 1;
            message += temp;
            total += temp;
            subtotal += temp;
            
            if (i != 7)
                message += " + ";
            else
                message += `] = ${subtotal}\n`;
        }

        subtotal = 0;
        message += "5d6: [";

        for (let i = 0; i < 5; i++) {
            let temp = parseInt(Math.random()*6) + 1;
            message += temp;
            total += temp;
            subtotal += temp;
            
            if (i != 4)
                message += " + ";
            else
                message += `] = ${subtotal}\n`;
        }

        total += 107

        message += `+ 35  \\\n+ 48   > (107)\n+ 24  /\n\`\`\`for a total of: ***${total} DAMAGE***`;
        */
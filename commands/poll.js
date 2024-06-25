const { SlashCommandBuilder, ButtonBuilder, EmbedBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder().setName('poll')
        .setDescription('Create a poll about a topic.')
        .addStringOption( option => 
            option.setName('question')
            .setDescription('The question being voted on in this poll.')
            .setRequired(true))
        .addStringOption( option =>
            option.setName('option-1')
            .setDescription('The first option for this poll')
            .setRequired(false))
        .addStringOption( option =>
            option.setName('option-2')
            .setDescription('The second option for this poll')
            .setRequired(false))
        .addStringOption( option =>
            option.setName('option-3')
            .setDescription('The third option for this poll')
            .setRequired(false))
        .addStringOption( option =>
            option.setName('option-4')
            .setDescription('The first option for this poll')
            .setRequired(false)),
    async execute(interaction) {
        let description = interaction.options.getString('question');

        let op_1, op_2, op_3, op_4;

        let options = [];

        if ((op_1 = interaction.options.getString('option-1')) != null) {
            options.push(op_1);
        }
        if ((op_2 = interaction.options.getString('option-2')) != null) {
            options.push(op_2)
        }
        if ((op_3 = interaction.options.getString('option-3')) != null) {
            options.push(op_3);
        }
        if ((op_4 = interaction.options.getString('option-4')) != null) {
            options.push(op_4);
        }

        if (options.length < 2) {
            await interaction.reply('```bash\nnot enough options to create the poll (need at least 2)\n```');
            return;
        }

        let em = new EmbedBuilder()
            .setDescription(description);

        await interaction.reply(`${description}\n1: ${options[0]}\n2: ${options[1]}\n3: ${options[2]}\n4: ${options[3]}`);
    }
}
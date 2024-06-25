const { SlashCommandBuilder } = require('@discordjs/builders');

let {servers} = require('../globals.js');

module.exports = {
    data: new SlashCommandBuilder().setName('loop')
        .setDescription('Toggles the loop ability')
        .addStringOption( option =>
            option.setName('status')
                .setDescription('show the status of the loop instead of toggling')
                .setRequired(false)
                .addChoices(
                    {name: 'show', value: 'show'}
                )),
    async execute(interaction) {
        await interaction.deferReply();
        let show_status = interaction.options.getString('status');

        if (show_status) {
            await interaction.editReply(`\`\`\`bash\nloop is currently ${(servers.get(interaction.guildId).repeating) ? ("enabled") : ("disabled")}\`\`\``);
            return;
        }

        servers.get(interaction.guildId).repeating = !servers.get(interaction.guildId).repeating;

        // repeating.set(interaction.guildId, !servers.get(interaction.guildId).repeating);

        await interaction.editReply(`\`\`\`bash\nloop is now ${(servers.get(interaction.guildId).repeating) ? ("enabled") : ("disabled")}\`\`\``);

        console.log(`[${interaction.guild.name}] loop is now ${servers.get(interaction.guildId).repeating}`);
    }
}
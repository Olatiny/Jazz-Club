const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application guild commands.'))
	.catch(console.error);

// rest.get(Routes.applicationCommands(clientId))
// .then(data => {
// 	const promises = [];
// 	for (const command of data) {
// 		const deleteUrl = `${Routes.applicationCommands(clientId)}/${command.id}`;
// 		promises.push(rest.delete(deleteUrl));
// 	}
// 	return Promise.all(promises);
// });
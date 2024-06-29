const { createAudioPlayer, AudioPlayer, getVoiceConnection, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const { MessageEmbed, MessageButton, MessageActionRow, Client } = require('discord.js');
const video_downloader = require('play-dl');
const ytSearch = require('yt-search');

video_downloader.getFreeClientID().then((clientId) => video_downloader.setToken({
    soundcloud : {
        client_id : clientId
    }
}));

// let queues = new Map();
// let queueMessages = new Map();
// // let connections = new Map();
// let playing = new Map();
// let startTimes = new Map();
// let repeating = new Map();
// let currSongs = new Map();
// let players = new Map();
// let hasListener = new Map();
// let hasDisconnected = new Map();
// let disconnectTimers = new Map();
// let funkyMode = new Map();
// let funkyTimeout = new Map();

class Server {
    constructor(guild_id) {
        // server ID;
        this.guild_id = guild_id;

        // song that is currently playing
        this.currentSong = null;

        /**
         * current stream reference, here so we can free it later.
         * @type {import('play-dl').YouTubeStream}
         */
        this.currentStream = null;

        // server queue and audio player
        this.queue = [];

        /**
         * @type {AudioPlayer}
         */
        this.audioPlayer = createAudioPlayer();

        // last queue message
        this.queueMessage = null;

        // last start time for song duration
        this.startTime = null;

        // reference to disconnect timer, so we can cancel it if we detect activity
        this.disconnectTimer = null;

        // boolean flags
        this.isPlaying = false;
        this.repeating = false;
        this.hasDisconnected = false;
        this.hasListener = false;
        this.funkyMode = false;
        this.funkyTimeout = false;
        // this.compact = false;   
    }

    async disconnect() {
        console.log("begin!");

        if (this.audioPlayer) {
            // console.log(this.audioPlayer.listenerCount(AudioPlayerStatus.Idle) + this.audioPlayer.listenerCount('error') + " listeners before");
            this.audioPlayer.removeAllListeners();
            this.audioPlayer.stop();
            // console.log(this.audioPlayer.listenerCount(AudioPlayerStatus.Idle) + this.audioPlayer.listenerCount('error') + " listeners after");
        } 

        if (getVoiceConnection(this.guild_id)) {
            // console.log(getVoiceConnection(this.guild_id).listenerCount(VoiceConnectionStatus.Disconnected) + " listeners before");
            await getVoiceConnection(this.guild_id).removeAllListeners();
            // console.log(getVoiceConnection(this.guild_id).listenerCount(VoiceConnectionStatus.Disconnected) + " listeners after");
            await getVoiceConnection(this.guild_id).destroy();
        } 

        if (this.currentStream) {
            this.currentStream.stream.emit("end");
            this.currentStream.stream.destroy();
        }
    }
}

// let a = new Server();

// a.disconnectTimer

/**
 * @type {Map<Number, Server>}
 */
let servers = new Map();

let nowPlayingMessageBuilder = async function(vid, guildId) {
    let currTime = Date.now()/1000;
    let time = 0;
    let minutes = 0;

    let video = vid;

    let timeRaw = servers.get(guildId).audioPlayer.state.playbackDuration;

    if (isNaN(timeRaw)) {
        timeRaw = 0;
    }

    var ms = timeRaw % 1000;
    timeRaw = (timeRaw - ms) / 1000;
    var secs = timeRaw % 60;
    timeRaw = (timeRaw - secs) / 60;
    var mins = timeRaw % 60;
    var hrs = (timeRaw - mins) / 60;
  
    let timeFormatted =  (hrs ? hrs + ':' : '') + (mins ? mins + ':' : '0:') + String(secs).padStart(2, '0');

    if (!(await video_downloader.validate(vid.url)).includes('so')) {
        // video = await ytSearch({videoId: vid.id ? vid.id : vid.videoId});
        video.author = {name: video.channel.name}
        video.thumbnail = vid.thumbnails[0].url;
    }

    const exampleEmbed = new MessageEmbed()
        .setColor('#b91c50')
        .setTitle(video.title)
        .setURL(video.url)
        .setAuthor({ name: 'Now playing:'})
        // .setDescription( video.description ? ((video.description.length > 200) ? (video.description.substring(0,200) + `\n\n... (${(video.description.length - 200)} characters omitted)`) : (video.description)) : (""))
        .setImage(video.thumbnail)
        .setThumbnail('https://cdn.discordapp.com/app-icons/887035742403035157/509d66ce4c97e054f303bd2f94874935.png?size=64')
        .addFields(
            {name: 'Channel', value: video.author.name, inline: true},
            {name: 'Duration', value: `${timeFormatted} / ${video.durationRaw}`, inline: true},
            // {name: 'Current position', value: `${Math.floor(minutes = Math.floor((time = Math.floor((currTime) - servers.get(guildId).startTime))/60))}:${Math.floor(time - minutes * 60).toString().padStart(2, '0')}`}
        );
    
    return exampleEmbed;
}

let nowPlayingCodeBlockVersion = function(video) {
    return `\`\`\`bash\nNow playing:\n-----------------------------------------------------------------------------\n"${video.title}"\n(${video.url})\`\`\``;
}

let addedToQueueEmbedBuilder = async function(vid, position) {
    let video = vid;

    video.author = {name: video.channel.name}
    if (!(await video_downloader.validate(vid.url)).includes('so')) {
        // video = await ytSearch({videoId: vid.id ? vid.id : vid.videoId});
        video.thumbnail = vid.thumbnails[0].url;
    }

    const exampleEmbed = new MessageEmbed()
        .setColor('#b91c50')
        .setTitle(video.title)
        .setURL(video.url)
        .setAuthor({ name: 'Added to queue:'})
        // .setDescription( video.description ? ((video.description.length > 200) ? (video.description.substring(0,200) + `\n\n... (${(video.description.length - 200)} characters omitted)`) : (video.description)) : (""))
        .setImage(video.thumbnail)
        .setThumbnail('https://cdn.discordapp.com/app-icons/887035742403035157/509d66ce4c97e054f303bd2f94874935.png?size=64')
        .addFields(
            {name: 'Channel', value: video.author.name, inline: true},
            {name: 'Duration', value: video.durationRaw ? video.durationRaw : "error getting duration", inline: true},
            {name: 'Position in queue', value: `${position}`, inline: true}
        );
    
    return exampleEmbed;
}

let queueMessageBuilder_old = async function(interaction, queue, pages = 1) {
    let msg = "```bash\nCurrent songs in queue (page 1):\n";
    let page = 1;

    msg += "-----------------------------------------------------------------------------\n";

    // console.log(queue);
    // console.log(queue[queue.length - 1]);

    for (var i = 0; i < queue.length && page <= ((pages >= 1) ? pages : 1); i++) {
        if (queue[i] == undefined)
            continue;
        
        let temp = i + 1;
        temp += ": \"";
        temp += queue[i].title;
        // console.log(i);
        temp += "\"\n   (";
        temp += queue[i].url;
        temp += ")\n";

        if (i < queue.length - 1) {
            temp += "-----------------------------------------------------------------------------\n";
        }

        if (msg.length + temp.length > 1996) {
            msg += "\n```";
            page++;

            if (page > pages) {
                break;
            }

            await interaction.channel.send(msg);
            msg = `\`\`\`bash\nCurrent songs in queue (page ${page}):\n`;
            msg += "-----------------------------------------------------------------------------\n";
            msg += temp;
            continue;
        } else {
            msg += temp;
        }
    }

    if (page <= pages)
        msg += "\n```";

    // console.log(msg);

    interaction.channel.send(msg);
}

let queueButtons = new MessageActionRow().addComponents(
    new MessageButton()
        .setCustomId("prev")
        .setStyle("SECONDARY")
        .setLabel("Previous"),
    new MessageButton()
        .setCustomId("next")
        .setStyle("SECONDARY")
        .setLabel("Next")
);

let queueMessageBuilder = async function(interaction, queue, client = undefined) {
    let pages = [];
    servers.get(interaction.guildId).queueMessage = {pgs: pages, idx: 0};
    // queueMessages.set(interaction.guildId, {pgs: pages, idx: 0});
    let msg = "```bash\nCurrent songs in queue (page 1):\n";

    msg += "-----------------------------------------------------------------------------\n";

    // console.log(queue);
    // console.log(queue[queue.length - 1]);

    for (var i = 0; i < queue.length; i++) {
        if (queue[i] == undefined)
            continue;
        
        let temp = i + 1;
        temp += ": \"";
        temp += queue[i].title ? queue[i].title : queue[i].name;
        // console.log(i);
        temp += "\"\n   (";
        temp += queue[i].url;
        temp += ")\n";

        if (i < queue.length - 1) {
            temp += "-----------------------------------------------------------------------------\n";
        }

        if (msg.length + temp.length > 1996) {
            msg += "\n```";

            // await interaction.channel.send(msg);
            pages.push(new String(msg));
            msg = `\`\`\`bash\nCurrent songs in queue (page ${pages.length + 1}):\n`;
            msg += "-----------------------------------------------------------------------------\n";
            msg += temp;
            continue;
        } else {
            msg += temp;
        }
    }

    if (!msg.substring(msg.length - 5).includes("\n```")) {
        msg += "\n```";
    }

    pages.push(msg)

    // console.log(pages[0]);
    // console.log("----");
    // console.log(pages[1]);

    await interaction.channel.send({content: pages[0].toString(), components: [queueButtons]});
}

const play_icon = '971015680600199178';
const pause_icon = '971015680637947934';
const skip_icon = '971015680654729216';
const stop_icon = '971015680696672356';
const loop_icon = '971015680629559296';
const shuffle_icon = '971015680633741312';

const rows = [new MessageActionRow().addComponents(
    new MessageButton()
        .setCustomId('play')
        .setEmoji('971015680600199178')
        .setStyle('SECONDARY')
        .setDisabled(false),
    new MessageButton()
        .setCustomId('skip')
        .setEmoji('971015680654729216')
        .setStyle('SECONDARY')
        .setDisabled(true),
    new MessageButton()
        .setCustomId('stop')
        .setEmoji('971015680696672356')
        .setStyle('SECONDARY')
        .setDisabled(true),
    new MessageButton()
        .setCustomId('loop')
        .setEmoji('971015680629559296')
        .setStyle('SECONDARY')
), new MessageActionRow().addComponents(
    new MessageButton()
        .setCustomId('add')
        .setLabel('Add Song')
        .setStyle('SECONDARY'),
    new MessageButton()
        .setCustomId('remove')
        .setLabel('Remove Song')
        .setStyle('DANGER')
)];

module.exports = {
    // queues,
    // funkyMode,
    // funkyTimeout,
    // connections,
    // players,
    // playing,
    // repeating,
    // currSongs,
    // hasListener,
    // hasDisconnected,
    // disconnectTimers,
    Server,
    servers,
    queueButtons,
    // queueMessages,
    // startTimes,
    nowPlayingMessageBuilder,
    queueMessageBuilder,
    addedToQueueEmbedBuilder,
    nowPlayingCodeBlockVersion,
}

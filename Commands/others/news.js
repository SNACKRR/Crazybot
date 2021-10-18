const makeEmbed = require('../../functions/embed');
const sendAndDelete = require("../../functions/sendAndDelete");
const config = require("../../config/config.json");
const updateObj = require("../../config/updates.json");
const {Permissions} = require("discord.js");
const Command = require("../../Classes/Command");

let updates = new Command("updates");

updates.set({
	aliases         : ["patchnotes","patch-notes","patches"],
	description     : "Sends a message that contains a summary of the latest update.",
	usage           : "updates [update (ex: ;updates 0.6.1)]",
	cooldown        : 10,
	unique          : false,
	category        : "other",
	whiteList       : null,
	worksInDMs      : true,
	isDevOnly       : false,
	isSlashCommand  : false
});

let poopyArray = [];
let int = 0;
for (const item in updateObj) {
	if(item !== config.version)poopyArray.push(item);
	int++;
}
poopyArray.reverse();
poopyArray.splice(5);


updates.execute =  function(message, args, server) {

	let update = args[0];
	if(!update)update = config.bot_info.version;
	let str = updateObj[update];
	if(!str){
		
		const embed = makeEmbed("Invalid value",`The given update value doesn't match`,server)
		sendAndDelete(message,embed,server);
		return false;
	}
	let bool = true;
	if(args[1] === "dont" &&message.guild.members.cache.get(message.author.id).permissions.has(Permissions.FLAGS.ADMINISTRATOR))bool = false;

	
const embed = makeEmbed(`CrazyBot patch ${update}`,updateObj[update],server,false,"It's advised to use `;sync` after an update");
embed.addField("Previous updates: ",`\`${poopyArray.join("`, `")}\``,true);
embed.setURL("https://github.com/Crazy4k/Crazybot");
message.channel.send( {embeds: [embed]} ).then(m => {
	setTimeout(()=>{
		if(!m.deleted && bool)m.delete().catch(e => console.log(e));
	},2 *60* 1000);
});
return true;
}

module.exports = updates;
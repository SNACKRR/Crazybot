
const moment = require('moment');

const mongo = require("../mongo");
let {guildsCache} = require("../caches/botCache");
const serversSchema = require("../schemas/servers-schema");
const makeEmbed = require(".././functions/embed");
const colors =require("../config/colors.json");

module.exports =async(channel) => {
	if(channel.type === 'DM') return;
	if(!channel.guild) return;

	try {
		let i = guildsCache[channel.guild.id];
		if(!i){
			await mongo().then(async (mongoose) =>{
				try{ 
					guildsCache[channel.guild.id] =i= await serversSchema.findOne({_id:channel.guild.id});
				} finally{
					console.log("FETCHED FROM DATABASE");
					mongoose.connection.close();
				}
			});
		}

		
		const serverLogs = channel.guild.channels.cache.get(i.logs.serverLog);
		if (serverLogs) {
			const embed = makeEmbed("Channel Deleted","",colors.failRed,true);
				embed.addFields(
					{ name:'name', value: channel.name, inline: false },
					{ name:'Category', value: `${channel.parent}`, inline: false },
					{ name:'created at', value: `${moment(channel.createdAt).format('MMMM Do YYYY, h:mm:ss a')}`, inline: false },
					{ name:'ID', value: channel.id, inline: false },
				);
			serverLogs.send({embeds: [embed]});
		}
				
	}catch (err) {console.log(err);}

	
	
}
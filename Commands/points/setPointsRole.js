const makeEmbed = require("../../functions/embed");
const checkRoles = require("../../functions/Response based Checkers/checkRoles");
const mongo = require("../../mongo");
const enable = require("../../functions/enablePoints");
let cache = require("../../caches/botCache").pointsCache;
const pointsSchema= require("../../schemas/points-schema");
const Command = require("../../Classes/Command");

let pointsRole = new Command("points-role");

pointsRole.set({
    
	aliases         : ["p-role","pointsrole","prole"],
	description     : "Sets the role that will be able to modify other user's points.",
	usage           : "points-role",
	cooldown        : 5,
	unique          : true,
	category        : "points",
	whiteList       : "ADMINISTRATOR",
	worksInDMs      : false,
	isDevOnly       : false,
	isSlashCommand  : true,
    options			: [
        {
            name : "action",
            description : "What action to do to the points role",
            choices: [{name: "change", value: "change"},{name: "remove", value: "remove"},],
            required : false,
            type: 3,
		},
		

	],
})



pointsRole.execute = async function(message, args, server, isSlash) { 

    
    let whiteListedRole;
    let author;
    let action = args[0];
    if(isSlash){
        author = message.user;
        if(args[0])action = args[0].value;
        else action = "none"
    }
    else author = message.author;

    let servery = cache[message.guild.id];

    if(!servery){
        await mongo().then(async (mongoose) =>{
            try{
                const data = await pointsSchema.findOne({_id:message.guild.id});
                cache[message.guild.id] = servery = data;
            }
            finally{
                    
                console.log("FETCHED FROM DATABASE");
                mongoose.connection.close();
            }
        })
    }
    if(!server.pointsEnabled) await enable(message, server);
    if(action === "change" || !servery.whiteListedRole || servery.whiteListedRole === ""){

    
        const embed = makeEmbed("White listed role.",`Ping the role that you want to be able to modify points.\nThis role will be able to view,remove,add and change the points of all users.\nType \`no\` for no one except admins.`, server);
    
        message.reply({embeds:[embed]});
        const messageFilter = m => !m.author.bot && m.author.id === author.id;
        message.channel.awaitMessages({filter: messageFilter, max: 1, time : 120000, errors: ['time']})
            .then(async (a) => {
                let checkedRole = checkRoles(a);
                switch (checkedRole) {
                    case "not valid":
                    case "not useable":
                    case "no args":               
                        message.channel.send("Invalid argument, command failed.");
                        return false;
                        break;
                    case "cancel":
                    case "no":
                        whiteListedRole = "";
                        break;
                    default:     
                        whiteListedRole = checkedRole;
                        break;
                    }                                        

                    await mongo().then(async (mongoose) =>{
                        try{
                            await pointsSchema.findOneAndUpdate({_id:message.guild.id},{
                                whiteListedRole: whiteListedRole
                            },{upsert:true});
                        } finally{
                            console.log("WROTE TO DATABASE");
                            mongoose.connection.close();
                        }
                    })
                    cache[message.guild.id].whiteListedRole = whiteListedRole;
                    let text = `Poeple with the role <@&${whiteListedRole}> can now modify other user's points.`;
                    if(whiteListedRole === "") text = `Only admins can now modify other user's points.`
                    const embed = makeEmbed(`✅ points manager role has been updated.`,text, "#24D900");
                    message.channel.send({embeds:[embed]}).catch(e=> console.log(e));
                    return true;
            });
    } else if(action === "none" || !action){
        const embed = makeEmbed(`You already have a points role set.`,`Current officer role: <@&${servery.whiteListedRole}>\nDo \`${server.prefix}points-role change\` to change it.`, server);
        message.reply({embeds:[embed]}).catch(e=> console.log(e));
    } else if( action === "remove") {
        
           
        await mongo().then(async (mongoose) =>{
            try{ 
                await pointsSchema.findOneAndUpdate({_id:message.guild.id},{
                    whiteListedRole: ""
                },{upsert:true});
                cache[message.guild.id].whiteListedRole = "";
            } finally{
                message.reply("Points role has been reset");
                console.log("WROTE TO DATABASE");
                mongoose.connection.close();
            }
        });
        return true;
                
            
        
        
    }           
}

module.exports =pointsRole;
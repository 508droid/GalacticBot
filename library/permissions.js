/*
	Name: Permissions
	Description: 
		Contains functions for checking permissions.
*/


// Checks if the `who` has a higher role then the user.
// <Guild>guild, <Member>who, <Member>user
exports.isHigherRole = function(guild, who, user)
{
	var h = exports.getHighestRolePos(who);
	var h2 = exports.getHighestRolePos(user);
	if(h > h2){
		return true;
	} else {
		return false;
	}
}

// Gets the highest roles position.
// <Member>member
exports.getHighestRolePos = function(member)
{
	var roles = member.roles
	var guild = member.guild;
	var h = 0;
	for(var i in roles){
		var p = guild.roles.get(roles[i]).position;
		if(p > h){
			h = p;
		}
	}
	return h;
}

// Checks to see if the member has the discord permission.
// <Member>member, <String>permission
exports.discordPerm = function(member, permission)
{
	if(member.permission.json[permission] !== undefined && member.permission.json[permission] === true){
		return true;
	} else {
		return false;
	}
}

// Checks to see if the member is able to use action on role.
// <Member>member, <Role>role, <String>perm
exports.permHigherThan = function(member, role, perm)
{
	var roles = member.roles
	var guild = member.guild;
	var rp = role.position;
	for(var i in roles){
		var p = guild.roles.get(roles[i]);
		if(p == undefined){
			continue;
		}
		if(p.position > rp && p.permissions.json[perm] != undefined && p.permissions.json["manageRoles"] == true){
			return true;
		}
	}
	return false;
}

// Get highest role with permission
exports.getHighestRoleWith = function(member, perm)
{

}


// canAssignRole
exports.canAssignRole = function(member, role)
{
	var p = member.permission.json;
	if(p["manageRoles"] !== undefined && p.manageRoles === true)
	{
		var pos = exports.getHighestRolePos(member);
		if(pos > role.position){
			return true;
		} else {
			return false;
		}
	} 
	return false;
}
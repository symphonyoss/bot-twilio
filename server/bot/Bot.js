var Engine = require('./Engine');
var BotQueue = require('./BotQueue');
var UrlModel = require('@symphony/ondobot-models').UrlModel;

String.prototype.splice = function (index, count, add) { return this.slice(0, index) + (add || "") + this.slice(index + count); }

var TITLE = 'Responder Bot';
var VERSION = '0.1.0';
var COPYRIGHT = '';

module.exports = new Class({
	initialize : function(client)
	{
		this.client = client;
		this.client.on('post', this.onPost.bind(this));
		this.client.on('join', this.onRoomJoin.bind(this));
		this.users = {};

		this.engine = new Engine();
		this.files = [];
		this.responses = [];
		this.queues = [];

		this.PMsUseText = true;
		this.defaultPmDst = 'PM_DST';
	},

	getQueue : function(reference) {
		this.queues[reference] = this.queues[reference] || new BotQueue(this, this.client);

		var queue = this.queues[reference];
		queue.setReadDelayTime(this.readDelay * 1000);
		queue.setTypingSpeed(this.typingSpeed);
		queue.setSelfSpamTime(this.selfSpamTime * 1000);
		queue.setOtherSpamTime(this.otherSpamTime * 1000);
		return queue;
	},

	replaceHandler : function(responseStr, response, start, prepId, data)
	{
		var idx;
		var name = data.name;
		var reference = data.reference;
		var length = response.length(prepId, start);

		idx = start + this.delta;
		this.workStr = this.workStr.splice(idx, length, responseStr);
		this.delta = this.delta + responseStr.length - length;
	},

	nameReplaceHandler : function(responseStr, response, start, match, data)
	{
		var idx;
		var name = data.name;
		var reference = data.reference;
		var length = response.length(prepId, start);

		idx = start + this.delta;
		this.workStr = this.workStr.splice(idx, length);

	// If the string %name appears in the response, then replace that with the original name
		var nameStr = new RegExp('%name', 'g');
		responseStr = responseStr.replace(nameStr, name);

		this.workStr = this.workStr.splice(idx, 0, responseStr);
		this.delta = this.delta + responseStr.length - length;
	},

	applyDefines : function(responseStr, user)
	{
		responseStr = this.engine.replaceDefines(responseStr);
		return responseStr;
	},

	//----------------------------------------------------------------------------

	applyGroupsSingle : function(responseStr, data)
	{
		var replace;
		var regExp;
		var idx;
		var type;
		var name = data.name;
		var reference = data.reference;

		function oneRegEx()
		{
			var match = regExp.exec(responseStr);
			if (!match) return false;

			this.workStr = match[1];
			replace = this.workStr;

			if (match && match[1]) {
				this.engine.checkResponses([type], [], false, replace, this.replaceHandler.bind(this), data);
			}

			responseStr = responseStr.splice(regExp.lastIndex - match[0].length, match[0].length, this.workStr);
			return true;
		}

		for (var idx = 0; idx < 10; idx++)
		{
			var regExp = new RegExp('%' + idx + '\\(([^)].*?)\\)', 'g');
			var type = 'MACRO' + idx;

			while(oneRegEx.call(this));
		}

		return responseStr;
	},

	applyGroups : function(responseStr, data)
	{
		var before;
		var tries;
		var changes;

		tries = 0;
		changes = true;
		this.delta = 0;
		while (tries < 10 && changes)
		{
			before = responseStr;
			responseStr = this.applyGroupsSingle(responseStr, data);
			changes = responseStr != before;
			tries++;
		}

		return responseStr;
	},

	//----------------------------------------------------------------------------

	morphName : function(user)
	{
		states = this.getUserStates(user);

	// Keep applying to the name?
		tries = 0;
		this.workStr = user;
		name = '';

		while (name !== this.workStr && tries < 20)
		{
			name = this.workStr;
			this.delta = 0;
			this.engine.checkResponses(['NAME'], states, false, name, this.nameReplaceHandler.bind(this), data);
			tries++
		}

		name = this.workStr;

	// Apply groups, after the fact. !Pending: should this be inside the above loop?
		name = this.applyGroups(name, user);

	// If the name ended up empty, just restore it
		if (name === '') name = user;

		return name;
	},

	applyData : function(responseStr, data)
	{
		var name = data.name;

		if (responseStr.indexOf('%name') !== -1) name = this.morphName(name);

		responseStr = responseStr.replace(/%name\b/g, name);
		responseStr = responseStr.replace(/%thread\b/g, data.reference);
		responseStr = responseStr.replace(/%mention\b/g, data.mention);
		responseStr = responseStr.replace(/%userid\b/g, data.id);
		responseStr = responseStr.replace(/%fullname\b/g, data.fullName);

		return responseStr;
	},

	applyTypo : function(responseStr, data)
	{
		var states;

		states = this.getUserStates(data.name);

		this.workStr = responseStr;
		this.delta = 0;
		this.engine.checkResponses(['TYPO'], states, false, responseStr, this.replaceHandler.bind(this), data);
		return this.workStr;
	},

	applyMTypo : function(responseStr, data)
	{
		var changes;
		var states;
		var tries;

		states = this.getUserStates(data.name);

		tries = 0;
		changes = true;
		while (changes && tries < 10)
		{
			this.workStr = responseStr;
			this.delta = 0;
			this.engine.checkResponses(['MTYPO'], states, false, responseStr, this.replaceHandler.bind(this), data);
			changes = responseStr !== this.workStr;
			responseStr = this.workStr;
			tries++;
		}

		return responseStr;
	},

	applyStandardMacros : function(responseStr, data)
	{
		responseStr = responseStr.replace(/%title/g, TITLE);
		responseStr = responseStr.replace(/%version/g, VERSION);
		responseStr = responseStr.replace(/%copyright/g, COPYRIGHT);
		responseStr = responseStr.replace(/%time/g, new Date().toLocaleTimeString());
		responseStr = responseStr.replace(/%date/g, new Date().toLocaleDateString());
		responseStr = responseStr.replace(/%fullname/g, data.name);

		return responseStr;
	},

	//----------------------------------------------------------------------------

	handleCommand : function(command, data)
	{
	// a double '/' means to execute now, otherwise it is queued up
		if (command.slice(0, 2) === '//')
		{
			command = command.slice(1);
			this.executeCommand(command, data);
		}

	// Should we special case state transitions? i'm going to say no
		else
			this.getQueue(data.reference).addCommand(command, data);
	},

	//----------------------------------------------------------------------------

	handleOneSubPost : function(dst, post, data, canPost)
	{
		var name = data.name;
		var reference = data.reference;
	// If we have an empty post, then it is just there for timing, queue it up, and exit
		if (post === '')
		{
			this.getQueue(reference).addPost(post, reference);
			return;
		}

	// Check for Emote
		if (post.charAt(0) == ':')
		{
			post = post.slice(1);
			if (dst === 'PM_DST')
				this.getQueue(reference).addPM(post, name, reference)
			else if (canPost)
				this.getQueue(reference).addEmote(post, reference)
		}

	// If not, check for a command
		else if (post.charAt(0) === '/')
		{
			post = this.applyData(post, data);
			this.handleCommand(post, reference);
		}
	// Otherwise it is a post
		else
		{
		// Do all the post processing on the response
			post = this.applyData(post, data);
			post = this.applyStandardMacros(post, data);
			post = this.applyGroups(post, data);
			post = this.applyTypo(post, data);
			post = this.applyMTypo(post, data);

			if (dst === 'PM_DST')
				this.getQueue(reference).addPM(post, name, reference)
			else if (canPost)
				this.getQueue(reference).addPost(post, reference)
		}
	},

	standardResponseHandler : function(responseStr, response, start, prepId, data)
	{
		var dst;
		var subIdx;
		var subResponse;
		var canRespond;
		var lastPost = 0;
		var name = data.name;
		var reference = data.reference;
		var length = response.length(prepId, start);

		if (lastPost === this.postCount && this.postCount !== 'ALWAYS_RESPOND' && this.singlePost) return;

		lastPost = this.postCount;

	// Apply the randomized defines first, this will add a little uniqueness
	// to the post before checking for duplication
		responseStr = this.applyDefines(responseStr, name);

	// Replace the groups introduced through defines
		responseStr = response.replaceGroups(responseStr, prepId, start);

	// Can we respond
		canRespond = this.getQueue(reference).canRespond();

	// See if we've done this before, !Pending: is this redundant with the stuff implemented in the queue?
		if (this.getQueue(reference).botPostExists(responseStr)) return;
		this.getQueue(reference).trackBotPost(responseStr);


	// Break out the subposts, determine the destination, and queue them up
	// Some commands are queued, some are executed immediately

	// I'm going to do this backwards compatably, but it might be better
	// to allow the destination indicator to be within each sub post
		dst = 'DEFAULT_DST';

		if (responseStr.charAt(0) === '=') dst = 'RETURN_DST';
		else if (responseStr.charAt(0) === ')') dst = 'CHAT_DST';
		else if (responseStr.charAt(0) === '(') dst = 'PM_DST';

	// Get rid of leader if present
		if (dst !== 'DEFAULT_DST')
			responseStr = responseStr.slice(1);

	//	Disambiguate the destination
		if (dst = 'DEFAULT_DST' && this.responseSrc === 'PM_SRC')
		{
			if	(this.defaultPmDst === 'CHAT_DST') dst = 'CHAT_DST';
			else dst = 'PM_DST';
		}
		else if (dst === 'DEFAULT_DST' && this.responseSrc === 'CHAT_SRC') dst = 'CHAT_DST';
		else if (dst = 'RETURN_DST' && this.responseSrc === 'CHAT_SRC') dst = 'CHAT_DST';
		else if (dst === 'RETURN_DST' && this.responseSrc === 'PM_SRC') dst = 'PM_DST';

		if (responseStr.charAt(0) != '|')
		{
			this.handleOneSubPost(dst, responseStr, data, canRespond);
		}
		else
		{
			responseStr = responseStr.slice(1);
			var subPosts = responseStr.split('|');
		// Break out the subposts if needed

			subPosts.each(function(post)
			{
				this.handleOneSubPost(dst, post, data, canRespond);
			}, this);
		}

	// If there was a parent state, then cancel the timeout, and unset the state
/*
		if rResponse.ParentState <> '' then
			begin
				mSetUserState(PChar(rData), rResponse.ParentState, 0);
				fQueue.mClearStateTimeout(PChar(rData), rResponse.ParentState);
			end;

	// Is there an implicit state
		if rResponse.ImplicitState <> '' then
			begin
			// Set the timeout, and queue the state change
				fQueue.mAddImplicitState(PChar(rData), rResponse.ImplicitState, fResponseSrc);
				fQueue.mAddStateTimeout(PChar(rData), rResponse.ImplicitState, fResponseSrc);
			end;
*/
	},

	//============================================================================
	// public tBotC methods
	//============================================================================

	onRoomJoin : function(data, roomName)
	{
		var reference = data.reference;
	// force responses, even after potential user joins
		this.getQueue(reference).clearResponded();

		this.postCount = 'ALWAYS_RESPOND';
		this.responseSrc = 'CHAT_SRC';
		this.engine.checkResponses(['ENTER'], [], true, roomName, this.standardResponseHandler.bind(this), data);
	},

	//----------------------------------------------------------------------------

	onUserEnter : function(userName, reference)
	{
		var name = userName;
		var states;
		var respondedJ;
		var respondedH;
		var data = {name: name, reference: reference};

		this.postCount = 'ALWAYS_RESPOND';

		name = userName;

	// Setup the new user
		states = this.eEngine.getDefaultStates();
		this.users[userName] = states;

	// Can we respond to this event
		if (!this.running) return;

	// Respond
		this.responseSrc = 'CHAT_SRC';

		respondedJ = this.engine.checkResponses(['JOIN'], states, false, name, this.standardResponseHandler.bind(this), data);
		respondedH = this.engine.checkResponses(['HERE'], states, false, name, this.standardResponseHandler.bind(this), data);

		if (respondedJ || respondedH) this.getQueue(reference).responded();
	},

	//----------------------------------------------------------------------------

	onUserExit : function(userName, reference)
	{
		var states;
		var name= userName;
		var data = {name: name, reference: reference};

		if (!userName) return;

		this.postCount = 'ALWAYS_RESPOND';

		name = userName;

	// Can we respond to this event
		if (this.running)
		{
			states = this.getUserStates(userName);
			this.responseSrc = 'CHAT_SRC';
			if (states)
				if (this.engine.checkResponses(['EXIT'], states, false, name, this.standardResponseHandler.bind(this), data))
					this.getQueue(reference).mResponded();
		}

	// Remove the user
		delete this.users[userName];
	},

	onUserPresent : function(userName, reference)
	{
		var states;
		var name = userName;
		var data = {name: name, reference: reference};

	// force responses, even after other potential user presents
		this.getQueue(reference).clearResponded();

		this.postCount = 'ALWAYS_RESPOND';

		name = userName;

	// Setup the new user
		states = this.engine.getDefaultStates();
		this.users[rUserName] = states;

	// Can we respond to this event
		if (!this.running) return;

	// Respond
		this.responseSrc = 'CHAT_SRC';
		if (this.engine.checkResponses(['HERE'], states, false, name, this.standardResponseHandler.bind(this), data))
			this.getQueue(reference).responded();
	},

	onPost : function(data, encodedPost, post)
	{
		var states;
		var name = data.name;
		var user = data.id;
		var reference = data.reference;
		var respondedU;
		var respondedT;
		var responded;

		respondedU = false;
		respondedT = false;
		this.postCount ++;

	// Check for spammed post
//		if (this.getQueue(reference).userPostExists(post, user)) return;

		this.getQueue(reference).trackUserPost(post, user);

		if (!this.running) return;

	// respond to this event, the queue makes sure that delays are being met
		this.responseSrc = 'CHAT_SRC';

	// First check for user posted
		states = this.getUserStates(user);
		if (states)
			respondedU = this.engine.checkResponses(['USER'], states, false, name, this.standardResponseHandler.bind(this), data);

	// Then check for post content
		states = this.getUserStates(user);
		if (states)
			respondedT = this.engine.checkResponses(['TEXT', 'CONVERSATION'], states, false, post, this.standardResponseHandler.bind(this), data);

		responded = respondedU || respondedT;

	// If we got no response, do a last chance response
		if (!responded)
			responded = this.engine.checkResponses(['OTHERWISE'], states, false, post, this.standardResponseHandler.bind(this), data);

		if (responded) this.getQueue(reference).responded();
	},

	onEmote : function(user, post, reference)
	{
		var states;
		var name = user;
		var respondedU;
		var tespondedT;
		var responded;
		var data = {name: name, reference: reference};

		respondedU = false;
		respondedT = false;

		postCount++;

		name = user;

	// Check for spammed post
//		if (this.getQueue(reference).userEmoteExists(post, user)) return;
		this.getQueue(reference).trackUserEmote(post, user);

		if (this.running) return;

	// respond to this event, the queue makes sure that delays are being met
		this.responseSrc = 'CHAT_SRC';

	// First check for user posted
		states = this.getUserStates(user);

		if (states)
			respondedU = this.engine.checkResponses(['USER'], states, false, name, this.standardResponseHandler.bind(this), data);

	// Then check for post content
		states = this.getUserStates(user);
		if (states)
			respondedT = this.engine.checkResponses(['TEXT', 'CONVERSATION'], states, false, post, this.standardResponseHandler.bind(this), data);

		responded = respondedU || respondedT;

	// If we got no response, do a last chance response
		if (!responded)
			responded = this.engine.checkResponses(['OTHERWISE'], states, false, post, this.standardResponseHandler.bind(this), data);

		if (responded) this.getQueue(reference).responded();
	},

	onPrivateMessage : function(user, post, reference)
	{
		var states;
		var name = user;
		var respondedU;
		var respondedP;
		var responded;
		var data = {name: name, reference: reference};

		respondedU = false;
		eespondedP = false;

		this.postCount++;

	// Check for spammed post
//		if (this.getQueue(reference).userPMExists(post, user)) return;
		this.getQueue(reference).trackUserPM(post, user);

		if (!this.running) return;

	// respond to this event, the queue makes sure that delays are being met
		this.responseSrc = 'PM_SRC';

	// First check for user posted
		states = this.getUserStates(user);
		if (states)
			respondedU = this.engine.checkResponses(['USER'], states, false, name, this.standardResponseHandler.bind(this), data);

	// The check for post conntent
		states = this.getUserStates(user);
		if (states)
			if (this.PMsUseText)
				respondedP = this.eEngine.checkResponses(['PM', 'TEXT', 'CONVERSATION'], states, false, post, this.standardResponseHandler.bind(this), data);
			else
				respondedP = this.eEngine.checkResponses(['PM', 'CONVERSATION'], states, false, post, this.standardResponseHandler.bind(this), data);

		responded = respondedU || respondedP;

	// If we got no response, do a last chance response
		if (!responded)
			responded = this.engine.checkResponses(['OTHERWISE', 'CATCH_ALL'], states, false, post, this.standardResponseHandler.bind(this), data);

		if (responded) this.getQueue(reference).mResponded();
	},

	onLogout : function()
	{
	},

	onLogin : function()
	{
	},

	onConnect : function()
	{
	},

	onDisconnect : function()
	{
	},

	setBotName : function(name)
	{
		this.name = name;
		this.engine.setBotName(name);
	},

	setReadDelaySeconds : function(seconds)
	{
		this.readDelay = seconds;
		this.queues.each(function(queue) {
			queue.setReadDelayTime(seconds * 1000);
		}, this);
	},

	setTypingSpeed : function(wordsPerMinute)
	{
		this.typingSpeed = wordsPerMinute;
		this.queues.each(function(queue) {
			queue.setTypingSpeed(wordsPerMinute);
		}, this);
	},

	setSelfSpamSeconds(seconds)
	{
		this.selfSpamSeconds = seconds;
		this.queues.each(function(queue) {
			queue.setSelfSpamTime(seconds * 1000);
		}, this);

	},

	setOtherSpamSeconds(seconds)
	{
		this.otherSpamSeconds = seconds;
		this.queues.each(function(queue) {
			queue.setOtherSpamTime(seconds * 1000);
		}, this);
	},

	setNestTimeoutSeconds : function(seconds)
	{
		this.nestTimeoutSeconds = seconds;
		this.queues.each(function(queue) {
			queue.setNestTimeoutTime(seconds * 1000);
		}, this);
	},

	setPMsUseText : function(on)
	{
		this.PMsUseText = on;
	},

	setDefaultPmDst(dst)
	{
		this.defaultPmDst = dst;
	},

	setSinglePost(on)
	{
		this.singlePost = on;
	},

	executeCommand : function(command, reference)
	{
		var originalCmd = command;
		command = command.replace(/[\t ]+/g, '|');
		var parts = command.split('|');

		if (!parts.length) return;

		switch (parts[0])
		{
			case '/timer':
				if (parts.length !== 3) return;

				name = parts[1];
				value = parts[2];

				this.getQueue(reference).addTimer(name, value, reference);
				break;
			case '/cancel':
				if (parts.length !== 2) return;
				name = parts[1];

				this.getQueue(reference).clearTimer(name, reference);
				break;
			case '/pause':
				if (parts.length == 2) parts.push('CHATROOM');
				if (parts.length !== 3) return;

				var length = parseInt(parts[1]);
				if (isNaN(length)) return;

				this.getQueue(reference).pause(parts[2], length);
				break;
			case '/url':
				var url = originalCmd.slice(5);
				var urlModel = new UrlModel();

				urlModel.getMessageMl(url)
					.then(function(content)
					{
						if (content)
							this.getQueue(reference).addPost(content, reference);
					}.bind(this))
					.fail(function(error)
					{
					}.bind(this));
		}
	},
/*
		var
			vIdx : Integer;
			vUser : String;
			vToken : String;
			vState : String;
			vValueStr : String;
			vValue : Integer;

		function GetNextToken(const rCommand : String; var rIdx : Integer) : String;

		begin
			Result := '';
			while (rIdx <= Length(rCommand)) and not (rCommand[rIdx] = ' ') do
				begin
					Result := Result + rCommand[rIdx];
					Inc(rIdx);
				end;
		end;

		function GetToEol(const rCommand : String; var rIdx : Integer) : String;

		begin
			Result := '';
			while rIdx <= Length(rCommand) do
				begin
					Result := Result + rCommand[rIdx];
					Inc(rIdx);
				end;
		end;

		procedure SkipWhiteSpace(const rCommand : String; var rIdx : Integer);

		begin
			while (rIdx <= Length(rCommand)) and (rCommand[rIdx] = ' ') do
				Inc(rIdx);
		end;

	begin
/*
		if Copy(rCommand, 1, 7) = '/state ' then
			begin
				vIdx := 7;
				SkipWhiteSpace(rCommand, vIdx);
				vUser := GetNextToken(rCommand, vIdx);
				SkipWhiteSpace(rCommand, vIdx);
				vState := GetNextToken(rCommand, vIdx);
				SkipWhiteSpace(rCommand, vIdx);
				vValueStr := GetNextToken(rCommand, vIdx);
				vValue := StrToIntDef(vValueStr, -1);
				if vUser = '' then Exit;
				if vState = '' then Exit;
				if vValueStr = '' then Exit;
				if (UpperCase(vUser) <> 'ALL') and not fUsers.mExist(vUser) then Exit;
				if (vValue < 0) or (vValue > 255) then Exit;

				if (UpperCase(vUser) = 'ALL') then
					mSetGlobalState(vState, vValue)
				else
					mSetUserState(vUser, vState, vValue);
			end
		else if Copy(rCommand, 1, 5) = '/add ' then
			begin
				vIdx := 5;
				SkipWhiteSpace(rCommand, vIdx);
				vUser := GetNextToken(rCommand, vIdx);
				SkipWhiteSpace(rCommand, vIdx);
				vState := GetNextToken(rCommand, vIdx);
				SkipWhiteSpace(rCommand, vIdx);
				vValueStr := GetNextToken(rCommand, vIdx);
				vValue := StrToIntDef(vValueStr, -1);
				if vUser = '' then Exit;
				if vState = '' then Exit;
				if vValueStr = '' then Exit;
				if (UpperCase(vUser) <> 'ALL') and not fUsers.mExist(vUser) then Exit;
				if (vValue < 0) or (vValue > 255) then Exit;

				if (UpperCase(vUser) = 'ALL') then
					mIncGlobalState(vState, vValue)
				else
					mIncUserState(vUser, vState, vValue);
			end
		else if Copy(rCommand, 1, 5) = '/sub ' then
			begin
				vIdx := 5;
				SkipWhiteSpace(rCommand, vIdx);
				vUser := GetNextToken(rCommand, vIdx);
				SkipWhiteSpace(rCommand, vIdx);
				vState := GetNextToken(rCommand, vIdx);
				SkipWhiteSpace(rCommand, vIdx);
				vValueStr := GetNextToken(rCommand, vIdx);
				vValue := StrToIntDef(vValueStr, -1);
				if vUser = '' then Exit;
				if vState = '' then Exit;
				if vValueStr = '' then Exit;
				if (UpperCase(vUser) <> 'ALL') and not fUsers.mExist(vUser) then Exit;
				if (vValue < 0) or (vValue > 255) then Exit;

				if (UpperCase(vUser) = 'ALL') then
					mDecGlobalState(vState, vValue)
				else
					mDecUserState(vUser, vState, vValue);
			end
		else if Copy(rCommand, 1, 6) = '/join ' then
			begin
				vIdx := 6;
				SkipWhiteSpace(rCommand, vIdx);
				vToken := GetToEol(rCommand, vIdx);
				if vToken = '' then Exit;
				fProvider.GotoRoom(vToken);
			end
		else if Copy(rCommand, 1, 9) = '/autojoin' then
			begin
				fProvider.AutoJoin;
			end
		else if Copy(rCommand, 1, 6) = '/knock' then
			begin
				fProvider.Knock;
			end
		else if Copy(rCommand, 1, 6) = '/goto ' then
			begin
				vIdx := 6;
				SkipWhiteSpace(rCommand, vIdx);
				vToken := GetToEol(rCommand, vIdx);
				if vToken = '' then Exit;
				fProvider.GotoUser(vToken);
			end
		else if Copy(rCommand, 1, 7) = '/timer ' then
			begin
				vIdx := 7;
				SkipWhiteSpace(rCommand, vIdx);
				vToken := GetNextToken(rCommand, vIdx);
				SkipWhiteSpace(rCommand, vIdx);
				vValueStr := GetNextToken(rCommand, vIdx);
				vValue := StrToIntDef(vValueStr, -1);

				if vToken = '' then Exit;
				if vValueStr = '' then Exit;
				if vValue < 0 then Exit;

				fQueue.mAddTimer(vToken, vValue);
			end
		else if Copy(rCommand, 1, 8) = '/cancel ' then
			begin
				vIdx := 8;
				SkipWhiteSpace(rCommand, vIdx);
				vToken := GetNextToken(rCommand, vIdx);

				if vToken = '' then Exit;

				fQueue.mClearTimer(vToken);
			end
		else if Copy(rCommand, 1, 7) = '/pause ' then
			begin
				vIdx := 7;
				SkipWhiteSpace(rCommand, vIdx);
				vValueStr := GetNextToken(rCommand, vIdx);
				vValue := StrToIntDef(vValueStr, -1);

				if vValueStr = '' then Exit;
				if vValue < 0 then Exit;


				SkipWhiteSpace(rCommand, vIdx);
				vToken := GetNextToken(rCommand, vIdx);
				if vToken = '' then vToken := 'CHATROOM';

				fQueue.mPause(vToken, vValue);
			end
		else if Copy(rCommand, 1, 8) = '/ignore ' then
			begin
				vIdx := 8;
				SkipWhiteSpace(rCommand, vIdx);
				vToken := GetToEol(rCommand, vIdx);
				if vToken = '' then Exit;
				fProvider.Ignore(vToken, True);
			end
		else if Copy(rCommand, 1, 10) = '/unignore ' then
			begin
				vIdx := 10;
				SkipWhiteSpace(rCommand, vIdx);
				vToken := GetToEol(rCommand, vIdx);
				if vToken = '' then Exit;
				fProvider.Ignore(vToken, false);
			end
		else if Copy(rCommand, 1, 4) = '/pm ' then
			begin
				vIdx := 4;
				SkipWhiteSpace(rCommand, vIdx);
				vUser := GetNextToken(rCommand, vIdx);
				SkipWhiteSpace(rCommand, vIdx);
				vToken := GetToEol(rCommand, vIdx);
				if vToken = '' then Exit;
				fProvider.PrivateMessage(vToken, vUser);
			end
	}
*/
	onTimer : function(timer, reference)
	{
		var states;

		states = this.getUserStates(this.name);
		this.responseSrc = 'CHAT_SRC';
		this.engine.checkResponses(['CHRON'], states, true, timer, this.standardResponseHandler.bind(this), {name: this.name, reference: reference});
	},

	//----------------------------------------------------------------------------

	onStateTimeout(user, state, src)
	{
/*
		var
			vStates : tStatesP;

	// Call the last chance handler for the state
		mGetUserStates(rUser, vStates);
		fResponseSrc := rSrc;
		fEngine.mCheckResponses([eTimeoutRT], vStates^, True, rUser, mStandardResponseHandler, PChar(rUser));

	// Clear the state
		mSetUserState(rUser, rState, 0);
*/
	},

	clearUserStates : function(user)
	{
		this.users[user] = {}
	},

	//----------------------------------------------------------------------------

	setUserState : function(user, state, value)
	{
/*
			vStates : tStatesP;
			vIdx : Integer;

	begin
		vStates := fUsers.mFind(rUser);
		if vStates = Nil then Exit;

		vIdx := fEngine.mGetStateIndex(rState);
		if vIdx = -1 then Exit;

		vStates^[vIdx] := rValue;
*/
	},

	//----------------------------------------------------------------------------

	incUserState(user, state, value)
	{
/*
		var
			vStates : tStatesP;
			vIdx : Integer;

	begin
		vStates := fUsers.mFind(rUser);
		if vStates = Nil then Exit;

		vIdx := fEngine.mGetStateIndex(rState);
		if vIdx = -1 then Exit;

		if vStates^[vIdx] + rValue > 255 then
			vStates^[vIdx] := 255
		else
			Inc(vStates^[vIdx], rValue);
*/
	},

	decUserState(user, state, value)
	{
/*
		var
			vStates : tStatesP;
			vIdx : Integer;

	begin
		vStates := fUsers.mFind(rUser);
		if vStates = Nil then Exit;

		vIdx := fEngine.mGetStateIndex(rState);
		if vIdx = -1 then Exit;

		if vStates^[vIdx] - rValue < 0 then
			vStates^[vIdx] := 0
		else
			Dec(vStates^[vIdx], rValue);
*/
	},

	getUserStates : function(user)
	{
		return [];
		this.users[user] = this.users[user] || this.engine.getDefaultStates();

		return this.users[user]

	},

	//----------------------------------------------------------------------------

	setGlobalState : function(state, value)
	{
/*
		var
			vIdx : Integer;

	begin
	// Set the state for all users
		for vIdx := 0 to Pred(fUsers.mCount) do
			mSetUserState(fUsers.Strings[vIdx], rState, rValue);

	// Set the default state for new users
		fEngine.mSetDefaultState(rState, rValue);
*/
	},

	incGlobalState : function(state, value)
	{
/*
		var
			vIdx : Integer;

	begin
	// Set the state for all users
		for vIdx := 0 to Pred(fUsers.mCount) do
			mIncUserState(fUsers.Strings[vIdx], rState, rValue);
*/
	},

	decGlobalState : function(state, value)
	{
/*
		var
			vIdx : Integer;

	begin
	// Set the state for all users
		for vIdx := 0 to Pred(fUsers.mCount) do
			mDecUserState(fUsers.Strings[vIdx], rState, rValue);
*/
	},

	clear : function()
	{

		this.engine.clear();
		this.files = [];

//		  for vIdx := 0 to Pred(fUsers.mCount) do
//			  mClearUserStates(fUsers.Strings[vIdx]);
	},

	clearQueue : function()
	{
		this.queues.each(function(queue) {
			queue.clear();
		}, this);
	},

	clearUsers : function()
	{
		this.users = {};
	},

	addResponses : function(responses)
	{
		this.responses.push(responses);
	},

	addResponseFile : function(filename)
	{
		this.files.push(filename);
	},

	load : function(onError)
	{
		var idx;

		this.engine.clear();

	// First pass, extract states
//		  for vIdx := 0 to Pred(fFiles.mCount) do
//			  fEngine.mAddStates(fFiles.Strings[vIdx], rOnError);

	// Second pass, read responses
		this.responses.each(function(responses)
		{
			this.engine.addResponses(responses, onError);
		}, this);

	// Adjust states
//		  for vIdx := 0 to Pred(fUsers.mCount) do
//			  mClearUserStates(fUsers.Strings[vIdx]);
	},

	run : function(on)
	{
		var idx;
		var user;
		var states;

		this.running = on;
		if (!this.running) {
			this.client.stop();
		}
/*
		if (on)
			for vIdx := 0 to Pred(fUsers.mCount) do
				begin
					vUser := fUsers.Strings[vIdx];
					vStates := tStatesP(fUsers.Data[vIdx]);
					fResponseSrc := eChatRs;
					fEngine.mCheckResponses([eHere], vStates^, false, vUser, mStandardResponseHandler, PChar(vUser));
				end;
*/
	},
});

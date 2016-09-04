var fs = require('fs');
var List = require('./List');
var BotQueue = require('./BotQueue');
var ImplicitStateEngine = require('./ImplicitStateEngine');
var RegExResponse = require('./RegExResponse');
var Response = require('./Response');
var MAX_GROUPS = 10;
var alphabetic = 'abcdefghijklmnopqrstuvwxyz' + 'abcdefghijklmnopqrstuvwxyz'.toUpperCase();
var numeric = '1234567890';
var alphanumeric = (alphabetic + numeric).split('');
var identifier = (alphabetic + numeric + '_.').split('');
var types = '0123456789iIsScCeExXjJhHlLuUdDtTmMpPfFvVnNoOaA'.split('');

module.exports = new Class({
	initialize : function()
	{
		this.states = new List();
		this.states.setSorted(true);

		this.responses = [];
		this.defines = {};

		this.stateEngine = new ImplicitStateEngine();
	},

	skipWhiteSpace : function(line, idx)
	{
		var whiteSpace = [' ', '\t'];

		while (idx < line.length && whiteSpace.indexOf(line.charAt(idx)) !== -1)
			idx++

		return idx;
	},

	skipTabs : function(line, idx)
	{
		while (idx < line.length && line.charAt(idx) === '\t')
			idx++

		return idx;
	},

	getNextToken : function(line, idx, delimiters)
	{
		var result = '';
		while (idx < line.length && delimiters.indexOf(line.charAt(idx)) === -1)
		{
			result += line.charAt(idx);
			idx++;
		}

		return {token: result, idx: idx};
	},

	getNextField : function(line, idx)
	{
		return this.getNextToken(line, idx, ['\t']);
	},

	getTokenOf : function(line, idx, delimiters)
	{
		var result = '';
		while (idx < line.length && delimiters.indexOf(line.charAt(idx)) !== -1)
		{
			result += line.charAt(idx);
			idx++;
		}

		return {token: result, idx: idx};
	},

	getIdentifier : function(line, idx)
	{
		return this.getTokenOf(line, idx, identifier);
	},

	getNumber(line, idx)
	{
		return this.getTokenOf(line, idx, numeric.split(''));
	},

	setFilterNone : function(filters)
	{
	},

	setFilterImplicit : function(filters)
	{
	},

	clearImplicit(filters)
	{
	},

	setFilterAll(filters)
	{
	},

	excludeFilter : function(filters, state, values)
	{
	},

	includeFilter(filters, state, values)
	{
	},

	setFilter : function(filters, state, values)
	{
		this.filters[state] = values;
	},

	replaceDefines : function(response)
	{
		Object.each(this.defines, function(define, name)
		{
			while (response.indexOf('$' + name) != -1)
			{
				var idx = Math.floor(Math.random() * define.length);
				var value = define[idx];

				response = response.replace('$' + name, value);
			}
		}, this);

		return response;
	},

	addDefine : function(name, value)
	{
		this.defines[name] = this.defines[name] || [];;
		this.defines[name].push(value);
	},

	expandSearch : function(search)
	{
		var Idx
		var pos;
		var defIdx;
		var name;
		var value;
		var list;

	// replace the bot name in the search expression
		if (this.nName != '') search = search.replace(/%name/g, this.name);

	// turn any defines into a series of string expressions replaced by '|', this will be used as part of the regular expression of the search
		var defines = Object.keys(this.defines);
		Object.each(this.defines, function(define, key)
		{
			var values = '';
			define.each(function(value)
			{
				if (values !== '') values += '|';
				values += value.escapeRegExp();
			}, this);


			try {
				var regExp = new RegExp('\\$' + key + '\\b', 'g');
			} catch (e) {
				console.log(define, values);
				console.log(e.stack);
			}
			search = search.replace(regExp, values);
		}, this);

		return search;
	},

	parseDirective(filename, line, row, filters, onError)
	{
	},

	syntaxCheck(filename, line, lineNbr, onError)
	{
		function error(str)
		{
			if (onError) onError(str + ' in ' + filename + '(' + lineNbr + ')\n\t' + line);
			return false;
		}

		line = line.trim();

		if (line === '') return;
		if (line.charAt(0) === ';') return;
		if (line.charAt(0) === '#') return;

		var parts = line.split('\t');
		if (parts.length != 5) ;

		var type = parts[0];
		var numerator = parseInt(parts[1], 10);
		var denominator = parseInt(parts[2], 10);
		var search = parts[3];
		var replace = parts[4];

		if (type.length !== 1) return error('the type field must be exactly on character');
		if (types.indexOf(type) === -1) return error('unknown type')

		if (isNaN(numerator)) return error ('numerator is not a number');
		if (numerator < 0) return error ('numerator must be greater than zero');
		if (isNaN(denominator)) return error ('denominator is not a number');
		if (denominator < 0) return error ('denominator must be greater than zero');
		if (numerator > denominator) return error ('numerator cannot be greater than denominator');

		return true;
	},

	setBotName : function(name)
	{
		this.name = name;
	},

	clear : function()
	{
		this.states.clear();
		this.responses = [];
		this.defines = {};
		this.stateEngine.clear();

		this.defaultStates = [];
	},

	addStates : function(filename, onError)
	{
	},

	addResponseFile : function(filename, onError)
	{
	},

	addResponses : function(responses, onError)
	{
		var file;
		var responses;
		var typeChar;
		var type;
		var isCaseSensitive;
		var numerator;
		var denominator;
		var search;
		var replace;
		var regExp;
		var idx;
		var filters;
		var stateName;
		var filename = '';

		function setup(thisType, thisCaseSensitive)
		{
			type = thisType;
			isCaseSensitive = thisCaseSensitive;
		}

		responses = responses.replace(/\r\n/g, '\n');
		responses = responses.replace(/		/g, '\t');
		responses = responses.replace(/	   /g, '\t');
		responses = responses.replace(/\t+/g, '\t');
		responses = responses.split('\n');

		responses.each(function(response, lineNbr)
		{
			response = response.trim();
			if (response === '') return;
			if (response.charAt(0) === ';') return;

			if (!this.syntaxCheck(filename, response, lineNbr, onError)) return;

			if (response[0] === '#')
			{
				this.parseDirective(filename, response, lineNbr, filters, onError);
				return;
			}

/*
			this.stateEngine.processLine(filename, lineNbr, line, vIdx, vError);
			stateName := this.stateEngine.getCurrentState();

			if stateName != '' then
				begin
				// Clear all the implicit states
					mClearImplicit(vFilters);

				// Get the state index
					vStateIdx := fStates.mFindIndex(vStateName);
					mSetFilter(vFilters, vStateIdx, [1]);
				end;
*/
			var parts = response.split('\t');
			var typeChar = parts[0];
			var numerator = parseInt(parts[1], 10);
			var denominator = parseInt(parts[2], 10);
			var search = parts[3];
			var replace = parts[4];

		// Check the command character
			switch (typeChar)
			{
				case 'i':
				case 'I': setup('TEXT', false); break;
				case 's':
				case 'S': setup('TEXT', true); break;
				case 'c':
				case 'C': setup('CHRON', false); break;
				case 'e':
				case 'E': setup('ENTER', false); break;
				case 'x':
				case 'X': setup('ERROR', false); break;
				case 'j':
				case 'J': setup('JOIN', false); break;
				case 'h':
				case 'H': setup('HERE', false); break;
				case 'l':
				case 'L': setup('EXIT', false); break;
				case 'u':
				case 'U': setup('USER', false); break;
				case 'd':
				case 'D': setup('DEFINE', false); break;
				case 't':
				case 'T': setup('TYPO', true); break;
				case 'm':
				case 'M': setup('MTYPO', true); break;
				case 'p': setup('PM', false); break;
				case 'P': setup('PM', true); break;
				case 'v': setup('CONVERSATION', false);	 break;
				case 'V': setup('CONVERSATION', true);	break;
				case 'o': setup('OTHERWISE', false);  break;
				case 'O': setup('OTHERWISE', true); break;
				case 'a': setup('CATCH_ALL', false);  break;
				case 'A': setup('CATCH_ALL', true); break;
				case 'f':
				case 'F': setup('TIMEOUT_RT', false); break;
				case 'n':
				case 'N': setup('NAME', true); break;
				case '0': setup('MACRO0', true); break;
				case '1': setup('MACRO1', true); break;
				case '2': setup('MACRO2', true); break;
				case '3': setup('MACRO3', true); break;
				case '4': setup('MACRO4', true); break;
				case '5': setup('MACRO5', true); break;
				case '6': setup('MACRO6', true); break;
				case '7': setup('MACRO7', true); break;
				case '8': setup('MACRO8', true); break;
				case '9': setup('MACRO9', true); break;
			}

		// handle defines differently
			if (type === 'DEFINE') this.addDefine(search, replace)
			else
			{
			// Do replacements in the serach expression
				search = this.expandSearch(search);

			// Compile the regular expression
				regExp = new RegExResponse(search, replace, isCaseSensitive, true);

			// Get the implicit state, if any
			/*
				stateName = this.stateEngine.getStateName(filename, idx);
				if not fStates.mExist(vStateName) then
					vStateName := '';

			// Handle 'a' separately, top level must not apply if there is any implicit state sets
				if (fStateEngine.mGetCurrentState = '') and (vType = eCatchAll) then
					begin
						mSetFilterImplicit(vFilters);
					end;

			*/

			// Make a response and add it to the list
				responseObj = new Response(type, regExp, numerator, denominator, filters, this.stateEngine.getCurrentState(), stateName);
				this.responses.push(responseObj);


			/*// Put it back the way it should be now
				if (fStateEngine.mGetCurrentState = '') and (vType = eCatchAll) then
					begin
						mClearImplicit(vFilters);
					end
			*/
			}

		// Clear the implicit state, if there is one
			/*
			vStateName := fStateEngine.mGetCurrentState;
			if vStateName <> '' then
				begin
				// Get the state index
					vStateIdx := fStates.mFindIndex(vStateName);
					mSetFilter(vFilters, vStateIdx, [0]);
				end;
			*/
		}, this);
	},

	checkResponses : function(types, states, executeAll, text, onResponse, data)
	{
		var textIdx;
		var idx;
		var response;
		var match;
		var length;
		var len;
		var replace;
		var result;
		var prepIds = [];

		result = false;
		textIdx = 0;

	// prepare the responses for the text
		for (idx = 0; idx < this.responses.length; idx++)
		{
			prepId = this.responses[idx].prep(text);
			prepIds.push(prepId);
		}

	// Loop through every character of the text
		while (textIdx <= text.length - 1)
		{
		// Loop through every response in the list, looking for a match
			idx = 0;
			found = false;
			while (idx < this.responses.length && !found)
			{
				response = this.responses[idx];
				if (response.typeMatch(types))
					if (response.filterMatch(states))
					{
						var prepId = prepIds[idx];
						length = response.matchAt(prepId, textIdx);
						replace = response.getReplacement();
						if (length !== 0)
							if (response.checkProbability())
							{
								if (onResponse)
								{
									onResponse(replace, response, textIdx, prepId, data);
									result = true;
								}

								if (!executeAll)
								{
									textIdx += length;
									found = true;
								}
							}
					}
				idx++;
			}

			if (!found) textIdx++;
		}

		for (idx = 0; idx < this.responses.length; idx++)
		{

			var prepId = prepIds[idx]
			this.responses[idx].freePrep(prepId);
		}

		return result;
	},

	pickDefine : function(name, found)
	{
		var list = [];
		var result = '';
		found = false;
		list = defines[name]
		if (!list) return undefined;
		return list[Math.floor(Math.rand() * list.length)];
	},

	getDefaultStates : function()
	{
/*
		var vIdx : Integer;

		SetLength(Result, fStates.mCount);
		for vIdx := Low(Result) to High(Result) do
			Result[vIdx] := fDefaultStates[vIdx];
*/
	},

	//----------------------------------------------------------------------------

	setDefaultState : function(state, value)
	{
/*
		var vIdx : Integer;

		if not fStates.mExist(rState) then Exit;
		vIdx := fStates.mFindIndex(rState);
		fDefaultStates[vIdx] := rValue;
*/
	},

	getStateIndex : function(state)
	{
/*
		Result := -1;
		if not fStates.mExist(rState) then Exit;
		Result := fStates.mFindIndex(rState);
*/
	},
});

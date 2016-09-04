module.exports = new Class({
	initialize : function(type, regEx, numerator, denominator, filters, parentState, implicitState)
	{
		this.type = type;
		this.regExp = regEx;
		this.numerator = numerator;
		this.denominator = denominator;
		this.parentState = parentState;
		this.implicitState = implicitState;

		this.filters = Array.clone(filters);
	},

	prep : function(string)
	{
		return this.regExp.prep(string);
	},

	freePrep : function(id)
	{
		this.regExp.freePrep(id);
	},

	filterMatch : function(states)
	{
		var idx;

		return true;
/*
		if (sates.length != this.filters.length) throw new Error('Internal Error: filter and state lengths differ');

		for idx(idx = 0; idx < rStates.length; idx++)
			if not (rStates[vIdx] in fFilters[vIdx]) return false;

		Result := True;
*/
	},

	getReplacement : function()
	{
		return this.regExp.replace;
	},

	typeMatch : function(types)
	{
		return types.indexOf(this.type) !== -1;
	},

	matchAt : function(id, startIndex)
	{
		return this.regExp.match(id, startIndex);
	},

	length : function(id, startIndex)
	{
		return this.regExp.length(id, startIndex);
	},

	checkProbability : function()
	{
		var random = Math.random();
		var result = random * this.denominator < this.numerator;

		return result;
	},

	replaceGroups : function(response, id, start)
	{
		return this.regExp.expand(response, id, start);
	},
});

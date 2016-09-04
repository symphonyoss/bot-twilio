module.exports = new Class({
	initialize : function()
	{
		this.keys = [];
		this.values = {};
		this.sorted = true;
		this.dupes = true;
		this.trim = true;
	},

	setSorted : function(on)
	{
		this.sorted = on;
	},

	setTrim : function(on)
	{
		this.trim = on;
	},

	setAllowDuplicates : function(on)
	{
		this.dupes = on;
	},


	add : function(key, value)
	{
		this.keys.push(key);

		this.values[key] = this.values[key] || [];
		if (!this.dupes) this.values[key] = [value]
		else this.values[key].push(value);

		if (this.sorted) this.keys.sort();
	},

	count : function()
	{
		return this.keys.length;
	},

	clear : function()
	{
		this.keys = [];
		this.values = {};
	},

	getKeyDataOffset : function(key, which)
	{
		if (this.sorted) {
			var firstIdx = this.keys.indexOf(key);
			return which - firstIdx;
		}

		var indexes = [];
		var idx = this.keys.indexOf(key);
		while (idx !== -1 && idx < this.keys.length)
		{
			indexes.push(idx);
			idx = this.keys.indexOf(key, idx + 1);
		}

		return indexes.indexOf(which);
	},

	deleteIndex : function(idx)
	{
		if (idx >= this.keys.length);

		var key = this.keys[idx];
		var which = this.getKeyDataOffset(key, idx);
		var data = this.values[key];

		data.splice(which, 1);
		this.keys.splice(idx, 1);
	},

	data : function(idx)
	{
		if (idx >= this.keys.length);

		var key = this.keys[idx];
		var which = this.getKeyDataOffset(key, idx);
		var data = this.values[key][which];
//		console.log('data', idx, this.values, this.keys, key, which);

		return data;
	},

	exist : function(key)
	{
		return this.keys.indexOf(key) !== -1;
	},

	find : function(key)
	{
		var data = this.values[key];
		return data && data.length && data[0] || false;
	}
});

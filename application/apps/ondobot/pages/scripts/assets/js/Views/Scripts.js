Package('Ondobot.Views', {
	Scripts : new Class({
		Extends : Sapphire.View,

		initialize : function()
		{
			this.parent();
			$('#new-script').click(this.onNewScript.bind(this));
			$('#save-script').click(this.onSaveScript.bind(this));
			$('#download-zip').click(this.onDownload.bind(this));
			$('#edit-script').click(this.onEditScript.bind(this));
			$('#quit-edit').click(this.onQuitEdit.bind(this));
			this.scripts = []
			this.editor = ace.edit('script-editor');
//			this.editor.setTheme('/ondobot/assets/js/3rdParty/ace/theme/monokai');
			this.editor.getSession().setUseSoftTabs(false);
			this.editor.getSession().setTabSize(15);

//			editor.getSession().setMode("ace/mode/javascript");;
		},

		draw : function(scripts)
		{
			$('#scripts-page').removeClass('script-edit');
			$('#scripts-page').addClass('script-list');

			var container = $('#script-listing');
			container.empty();

			scripts.sort(function(a, b)
			{
				var aStr = a.name.toLowerCase();
				var bStr = b.name.toLowerCase();

				return aStr.localeCompare(bStr)
			});

			this.scripts = [];
			scripts.each(function(script)
			{
				var template = SAPPHIRE.templates.get('script-item');
				var item = {script: script, selector: template};
				this.scripts.push(script.name);

				template.find('#script-item-name').text(script.name);
				template.click(this.onTemplateClick.bind(this, item));

				container.append(template);
			}, this);
		},

		error : function(message)
		{
		},

		onNewScript : function()
		{
			$('#scripts-page').removeClass('script-list');
			$('#scripts-page').addClass('script-edit');
			$('#script-name-input').val('');
			this.editor.getSession().setValue('');
			this.curItem = null;
		},

		onTemplateClick : function(item)
		{
			$('.script-item').removeClass('script-item-selected');
			item.selector.addClass('script-item-selected');
			this.curItem = item;
		},

		onEditScript : function()
		{
			if (!this.curItem) return;
			$('#scripts-page').removeClass('script-list');
			$('#scripts-page').addClass('script-edit');
			$('#script-name-input').val(this.curItem.script.name);
			$('#script-publish-input').prop('checked', this.curItem.script.public);
			this.editor.getSession().setValue(this.curItem.script.content);
		},

		onQuitEdit : function()
		{
			$('#scripts-page').addClass('script-list');
			$('#scripts-page').removeClass('script-edit');
		},

		onDownload : function()
		{
			this.fire('download');
		},

		onSaveScript : function()
		{
			var doc = this.editor.getSession().getDocument();
			if (doc.$lines.length === 0) return this.error('Script cannot be empty');
			var content = doc.$lines.join('\n');
			var name = $('#script-name-input').val();
			var public = $('#script-publish-input').prop('checked');
			if (!name) return this.error('Script needs a name');
			console.log('public', public);

			if (!this.curItem) return this.fire('new-script', content, name, public);

			this.curItem.script.name = name;
			this.curItem.script.content = content;
			this.curItem.script.public = public;

			this.fire('save-script', this.curItem.script);
		}
	})
});

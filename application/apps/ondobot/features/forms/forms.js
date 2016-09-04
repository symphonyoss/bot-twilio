var Q = require('q');
var Feature = require('sapphire-express').Feature;

module.exports = function(req, res, app)
{
	var forms = new Feature(app, '/ondobot/features/forms/');

  	forms.addJS(['assets/js/Controllers/Forms.js', 'assets/js/Views/Forms.js']);

	return Q(app);
}

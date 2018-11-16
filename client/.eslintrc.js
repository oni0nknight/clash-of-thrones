
module.exports = 
{
	"extends": "../.eslintrc.js",

	"env":
	{
		"browser": true
	},

	"globals":
	{
		"Phaser": true,
		"require": true
	},

	"rules":
	{
		// Prevent the use of the built-in console functions
		// https://eslint.org/docs/rules/no-console
		"no-console": "warn"
	}
}

module.exports = 
{
	"extends": "../.eslintrc.js",

	"globals":
	{
		"Phaser": true
	},

	"rules":
	{
		// Prevent the use of the built-in console functions
		// https://eslint.org/docs/rules/no-console
		"no-console": "warn"
	}
}
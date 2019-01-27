# Write Good Linter for Visual Studio Code

Provides a [write-good](https://github.com/btford/write-good) linter extension for [Visual Studio Code](https://code.visualstudio.com/).

## Installation

Press F1 or CTRL+P and type out `> ext install write good linter`. Check out the latest published version on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=travisthetechie.write-good-linter).

## Settings

`write-good.languages` defaults to `["markdown"]`, but it can be overridden to something like `["markdown", "plaintext"]` if you would like linting to apply to other filetypes.

`write-good.write-good-config` is a direct pass through to the underlying [write-good](https://github.com/btford/write-good) engine. To enable eprime check and disable check for so at the start of sentance, add `"write-good.write-good-config": { "eprime": true, "so": false }` to your settings.

## License and acknowledgements

This is licensed under the MIT open source license. Do what you want with this software, just include notice that it orginated with me.

The heavy lifting of this extension is done via [Brian Ford](https://twitter.com/briantford)'s [write-good](https://www.npmjs.com/package/write-good) npm module. 

## Working on this project

Install Node.js & `npm install` in the project.

Open up the project in Visual Studio Code and hit F5 to open up a *developement host* version of Visual Studio Code with the extension installed. Open up a Markdown file and write some bad prose to see linter in action.

Check out the [Extending Visual Studio Code](https://code.visualstudio.com/Docs/extensions/overview) documentation for more information.

## Publishing

1. `npm install -g vsce`
1. Visit https://travisthetechie.visualstudio.com/_details/security/tokens for a token (all accounts, all scopes)
1. `vsce login travisthetechie`
1. `vsce publish <version>`

## Thank you to contributors

Thank you to [James Ruskin](https://github.com/JPRuskin) for enabling settings. [PR4](https://github.com/TravisTheTechie/vscode-write-good/pull/4)
# The Symfuny Chat Bot

[![FINOS - Archived](https://cdn.jsdelivr.net/gh/finos/contrib-toolbox@master/images/badge-archived.svg)](https://finosfoundation.atlassian.net/wiki/display/FINOS/Archived)

To run this bot locally, there are three prerequisites:
- Install node.js
- Install redis
- Install mongodb

These should be done in their out of the box configurations.

Once these are installed, clone this repository. In the shell of the root directory of the repository, enter the command:

```npm install```

This will run all the step necessary to install are the required modules.

After that you need to run two processes. In the `./applications` directory run `node server` and in the `./server directory` also run `node server`

To use the bot, go to this url:
`https://corporate.symphony.com/client/index.html?bundle=https://localhost:8081/ob-controller/assets/json/bundle.json#`

Then add the bot from the app store and go wild.

Instructions on how to use the bot can be found in the application module under the help tab.


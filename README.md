# The Symfuny Chat Bot

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

## Contributing

1. Fork it (<https://github.com/symphonyoss/bot-twilio/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Read our [contribution guidelines](.github/CONTRIBUTING.md) and [Community Code of Conduct](https://www.finos.org/code-of-conduct)
4. Commit your changes (`git commit -am 'Add some fooBar'`)
5. Push to the branch (`git push origin feature/fooBar`)
6. Create a new Pull Request

## License

The code in this repository is distributed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

Copyright 2016-2019 Symphony Communication Services, LLC
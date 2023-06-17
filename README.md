## Purpose

This project creates interactive Voronoi diagram edges. [Here is a blog post describing the project](https://www.mtmckenna.com/posts/2023/06/16/voronoi-diagrams). [A live version is running here](https://voronoijs.netlify.app/).

<img width="525" alt="Screenshot 2023-06-16 at 10 20 49 PM" src="https://github.com/mtmckenna/voronoi/assets/361430/f57ca3c9-a963-4188-9495-cc2c2c41267c">

The project boilerplate is taken from [js13k-webpack-typescript-starter-party](https://github.com/mtmckenna/js13k-webpack-typescript-starter-party).

## Requirements

The commands assume [Yarn](https://yarnpkg.com/en/docs/install) is installed.

## Commands

### `yarn install`

Installs dependencies.

### `yarn start`

Starts [webpack-dev-server](https://webpack.js.org/configuration/dev-server/) at `http://0.0.0.0:8080`. You should be able to access the server on your mobile device from your home network by going to your computer's IP address (e.g. `http://192.168.0.2:8080`).

### `yarn build`

Builds, minifies, and inlines the game to `./dist/index.html`. This command also runs [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer), and places the report in `./dist/report.html`. This report may be handy in figuring out which of your source files is putting you over the edge of 13k.

### `yarn party`

Builds, minifies, inlines, and zips the game to `./zipped/game.zip`. This command finishes with a log message letting you know if the zip file is under 13k.

## Notes

- Put your TS or JS in `src/index.ts`
- Put your css in `src/index.html`
- Put your images or other assets in `assets/`
- This starter pulls in [this plugin](https://github.com/facebook/create-react-app/blob/edc671eeea6b7d26ac3f1eb2050e50f75cf9ad5d/packages/react-dev-utils/InlineChunkHtmlPlugin.js#L10) from Facebook's [create-react-app](https://reactjs.org/docs/create-a-new-react-app.html) to inline the JS into the HTML file.

# Mass dashboards creator

NodeJS script allowing to create and upload many dashboards at once to a Content Server, for scaling tests.

## Prerequisites

- [NodeJS](https://nodejs.org/en/download/)
- [Yarn](https://classic.yarnpkg.com/en/docs/install)

## Install

- Run:

```
yarn
```

## Run

In your `configuration.json` file, make sure to specify:

- your Content Server's URL
- your ActiveUI version ("4" or "5")
- the credentials of the user with whom you will upload
- the number of copies you wish to create
- the state of the dashboard you wish to use (that you can grab from your Content manager, on a dashboard that you manually created beforehand)

Then run:

```
node upload -c ./path/to/your/configuration.json
```

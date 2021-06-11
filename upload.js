const fetch = require("node-fetch");
const { readJSON } = require("fs-extra");
const base64 = require("base-64");

const { getUIFolder } = require("./getUIFolder");

/**
 * Uploads a number of copies of a given dashboard onto a Content Server.
 * Useful for scaling tests.
 */
const upload = async () => {
  try {
    const configurationPath =
      process.argv[process.argv.indexOf("-c") + 1] ?? "./configuration.json";
    const {
      activeUIVersion,
      contentServerUrl,
      dashboard,
      numberOfCopies,
      numberOfFolders,
      password,
      username,
    } = await readJSON(configurationPath);

    const uiFolder = getUIFolder({
      activeUIVersion,
      dashboard,
      numberOfCopies,
      numberOfFolders,
      username,
    });

    const response = await fetch(
      `${contentServerUrl}/rest/v4/files/ui/?import=`,
      {
        method: "POST",
        body: JSON.stringify({
          contentTree: uiFolder,
          overwrite: true,
          recursive: true,
        }),
        headers: {
          Authorization: `Basic ${base64.encode(`${username}:${password}`)}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (response.status !== 200 || data.status !== "success") {
      throw new Error(
        `Received HTTP status of ${response.status}.\n${JSON.stringify(
          data,
          undefined,
          2
        )}`
      );
    }

    console.log(
      `Succesfully uploaded ${numberOfCopies} copies of the given dashboard to the Content Server.`
    );
  } catch (error) {
    console.error(`ERROR. Upload failed.\n${error.stack}`);
    process.exit(1);
  }
};

upload();

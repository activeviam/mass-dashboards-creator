/**
 * Returns the content of the UI folder, to upload to the Content Server.
 */
const getUIFolder = ({
  activeUIVersion,
  dashboard,
  numberOfCopies,
  username,
}) => {
  if (!["4", "5"].includes(activeUIVersion)) {
    throw new Error(
      `Invalid ActiveUI version "${activeUIVersion}". Supported versions are ["4", "5"].`
    );
  }

  const entry = {
    owners: [username],
    readers: [username],
    timestamp: new Date().getTime(),
    lastEditor: username,
    canRead: true,
    canWrite: true,
  };

  const setOfIds = new Set();
  while (setOfIds.size < numberOfCopies) {
    setOfIds.add(Math.random().toString(36).slice(-3));
  }
  const ids = Array.from(setOfIds);

  const uiFolder = {
    entry: {
      ...entry,
      isDirectory: true,
    },
    children: {},
  };

  if (activeUIVersion === "4") {
    const stringifiedDashboard = JSON.stringify(dashboard, undefined, 2);

    // ActiveUI 4 stores everything (dashboards, widgets, filters) under /bookmarks.
    uiFolder.children.bookmarks = {
      entry: {
        ...entry,
        isDirectory: true,
      },
      children: ids.reduce(
        (acc, id) => ({
          ...acc,
          [id]: {
            entry: {
              ...entry,
              content: stringifiedDashboard,
            },
          },
        }),
        {}
      ),
    };

    // ActiveUI 4 only stores ids under /structure (and not the names of the dashboards).
    // This unfortunately implies having to fetch every single dashboard entirely in order to display their tree.
    uiFolder.children.structure = {
      entry: {
        ...entry,
        isDirectory: true,
      },
      children: ids.reduce(
        (acc, id) => ({
          ...acc,
          [id]: {
            entry: {
              ...entry,
              isDirectory: true,
            },
          },
        }),
        {}
      ),
    };
  } else {
    const { name, ...rest } = dashboard;
    const stringifiedDashboard = JSON.stringify(rest, undefined, 2);
    const stringifiedMetaData = JSON.stringify({ name }, undefined, 2);

    // ActiveUI 5 has dedicated folders for dashboards / widgets / filters.
    uiFolder.children.dashboards = {
      entry: {
        ...entry,
        isDirectory: true,
      },
      children: {},
    };

    uiFolder.children.dashboards.children.content = {
      entry: {
        ...entry,
        isDirectory: true,
      },
      children: ids.reduce(
        (acc, id) => ({
          ...acc,
          [id]: {
            entry: {
              ...entry,
              content: stringifiedDashboard,
            },
          },
        }),
        {}
      ),
    };

    // ActiveUI 5 stores the metadata (everything needed to display the tree of dashboards) under /structure.
    // This allows to not fetch every single dashboard in order to display their tree.
    uiFolder.children.dashboards.children.structure = {
      entry: {
        ...entry,
        isDirectory: true,
      },
      children: ids.reduce(
        (acc, id) => ({
          ...acc,
          [id]: {
            entry: {
              ...entry,
              isDirectory: true,
            },
            children: {
              [`${id}_metadata`]: {
                entry: {
                  ...entry,
                  content: stringifiedMetaData,
                },
              },
            },
          },
        }),
        {}
      ),
    };
  }

  return uiFolder;
};

module.exports = {
  getUIFolder,
};

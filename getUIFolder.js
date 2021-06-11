/**
 * Returns the content of the UI folder, to upload to the Content Server.
 */
const getUIFolder = ({
  activeUIVersion,
  dashboard,
  numberOfCopies,
  numberOfFolders,
  username,
}) => {
  if (!["4", "5"].includes(activeUIVersion)) {
    throw new Error(
      `Invalid ActiveUI version "${activeUIVersion}". Supported versions are ["4", "5"].`
    );
  }

  if (numberOfCopies % numberOfFolders !== 0) {
    throw new Error(
      `Invalid number of copies (${numberOfCopies}). It must be a multiple of the number of folders (${numberOfFolders}).`
    );
  }

  const numberOfCopiesPerFolder = numberOfCopies / numberOfFolders;

  const entry = {
    owners: [username],
    readers: [username],
    timestamp: new Date().getTime(),
    lastEditor: username,
    canRead: true,
    canWrite: true,
  };

  const setOfIds = new Set();
  while (setOfIds.size < numberOfCopies + numberOfFolders) {
    setOfIds.add(Math.random().toString(36).slice(-3));
  }
  const ids = Array.from(setOfIds);

  const folderIds = ids.slice(0, numberOfFolders);
  const dashboardIds = ids.slice(numberOfFolders);

  const uiFolder = {
    entry: {
      ...entry,
      isDirectory: true,
    },
    children: {},
  };

  if (activeUIVersion === "4") {
    // ActiveUI 4 stores everything (dashboards, widgets, filters) under /bookmarks.
    uiFolder.children.bookmarks = {
      entry: {
        ...entry,
        isDirectory: true,
      },
      children: {},
    };

    uiFolder.children.bookmarks.children.content = {
      entry: {
        ...entry,
        isDirectory: true,
      },
      children: {
        ...dashboardIds.reduce(
        (acc, dashboardId, dashboardIndex) => ({
          ...acc,
          [dashboardId]: {
            entry: {
              ...entry,
              content: JSON.stringify(
                { ...dashboard, name: `${dashboard.name} ${dashboardIndex}` },
                undefined,
                2
              ),
            },
          },
        }),
        {}
      ),
      ...folderIds.reduce((acc, folderId, folderIndex) => ({
        ...acc,
        [folderId]: {
          entry: {
            ...entry,
            content: JSON.stringify({name: `Folder ${folderIndex}`, type: "folder"}, undefined, 2)
          }
        }
      }), {})
      }
    };

    // ActiveUI 4 only stores ids under /structure (and not the names of the dashboards).
    // This unfortunately implies having to fetch every single dashboard entirely in order to display their tree.
    uiFolder.children.bookmarks.children.structure = {
      entry: {
        ...entry,
        isDirectory: true,
      },
      children: folderIds.reduce((acc, folderId, folderIndex) => {
        const idsOfDashboardsInFolder = dashboardIds.slice(
          folderIndex * numberOfCopiesPerFolder,
          (folderIndex + 1) * numberOfCopiesPerFolder
        );
        return {
          ...acc,
          [folderId]: {
            entry: {
              ...entry,
              isDirectory: true,
            },
            children: idsOfDashboardsInFolder.reduce(
              (innerAcc, dashboardId) => ({
                ...innerAcc,
                [dashboardId]: {
                  entry: {
                    ...entry,
                    isDirectory: true,
                  },
                },
              }), {}
            ),
          },
        };
      }, {}),
    };
  } else {
    const { name, ...rest } = dashboard;
    const stringifiedDashboard = JSON.stringify(rest, undefined, 2);

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
      children: dashboardIds.reduce(
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
      children: folderIds.reduce((acc, folderId, folderIndex) => {
        const idsOfDashboardsInFolder = dashboardIds.slice(
          folderIndex * numberOfCopiesPerFolder,
          (folderIndex + 1) * numberOfCopiesPerFolder
        );
        return {
          ...acc,
          [folderId]: {
            entry: {
              ...entry,
              isDirectory: true,
            },
            children: {
              [`${folderId}_metadata`]: {
                entry: {
                  ...entry,
                  content: JSON.stringify(
                    { name: `Folder ${folderIndex}`, isFolder: true },
                    undefined,
                    2
                  ),
                },
              },
              ...idsOfDashboardsInFolder.reduce(
                (innerAcc, dashboardId, dashboardIndex) => ({
                  ...innerAcc,
                  [dashboardId]: {
                    entry: {
                      ...entry,
                      isDirectory: true,
                    },
                    children: {
                      [`${dashboardId}_metadata`]: {
                        entry: {
                          ...entry,
                          content: JSON.stringify(
                            { name: `${name} ${dashboardIndex}` },
                            undefined,
                            2
                          ),
                        },
                      },
                    },
                  },
                }), {}
              ),
            },
          },
        };
      }, {}),
    };
  }

  return uiFolder;
};

module.exports = {
  getUIFolder,
};

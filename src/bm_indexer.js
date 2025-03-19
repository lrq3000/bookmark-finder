console.log(`hello from pop-up js`);
console.log(chrome.runtime.getURL(`hello_popup.html`));

const url = `http://google.com`;

// utility - pause execution for the given time t
const waitForTime = (t) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, t);
    });
};

// utility - wait until a Chrome Tab to be loaded
const waitTabUntilLoaded = (tab) => {
    return new Promise(async (resolve, reject) => {
        while (true) {
            console.log(`tab.status = ${tab.status}`);

            if (tab.status == `complete`) {
                resolve(tab);
                return;
            }

            await waitForTime(200);
        }
    });
};

// utility - get webpage title
function getTitle() {
    return document.title;
}

// utility - get webpage content
function getContent() {
    const el = document.querySelector(`*`);
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNode(el);
    selection.removeAllRanges();
    selection.addRange(range);
    return window.getSelection().toString();
}

// get all the bookmarks from Chrome Bookmark Manager
const getAllBookmarks = () => {
    const bmsList = [];

    const flattenBms = (bms) => {
        for (let i = 0; i < bms.length; i++) {
            if (bms[i].children && bms[i].children.length > 0) {
                flattenBms(bms[i].children);
            }
            else {
                if (bms[i].url) {
                    bmsList.push({
                        title: bms[i].title,
                        url: bms[i].url
                    })
                }
            }
        }
    };

    return new Promise(async (resolve, reject) => {
        chrome.bookmarks.getTree((bms) => {
            flattenBms(bms);
            resolve(bmsList);
        });
    });
}

// utility - execute script and handle errors
const executeContentScript = (tabId, func) => {
    return new Promise((resolve, reject) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabId, allFrames: false },
                func: func,
            },
            (injectionResult) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                } else if (injectionResult && injectionResult.length > 0) {
                    resolve(injectionResult[0].result);
                } else {
                    reject(`Script execution failed or returned empty result`);
                }
            }
        );
    });
};

// open a webpage and get page title and capture page content
const processPage = (url) => {
    return new Promise(async (resolve, reject) => {
        let tabId;

        const cleanup = () => {
            chrome.tabs.onUpdated.removeListener(indexPageWhenLoaded);
            chrome.tabs.onRemoved.removeListener(handleCloseTab);
            if (tabId) {
                chrome.tabs.remove(tabId);
            }
        };

        const handleCloseTab = async (closedTabId, info) => {
            if (closedTabId === tabId) {
                console.log(`tab has been closed for url: ${url}`);
                cleanup();
                reject(`Tab closed prematurely for URL: ${url}`);
            }
        };

        const indexPageWhenLoaded = async (updatedTabId, info) => {
            if (updatedTabId === tabId && info.status === 'complete') {
                console.log(`Tab loaded for url: ${url}`);
                chrome.tabs.get(tabId, async (tab) => { // get tab to ensure it's still valid
                    if (chrome.runtime.lastError || !tab) {
                        cleanup();
                        reject(chrome.runtime.lastError ? chrome.runtime.lastError.message : `Tab not found for URL: ${url}`);
                        return;
                    }

                    try {
                        const pageContent = await executeContentScript(tabId, getContent);
                        const pageTitle = await executeContentScript(tabId, getTitle);
                        resolve({ pageContent, pageTitle });
                    } catch (error) {
                        reject(`Failed to process page content for ${url}: ${error}`);
                    } finally {
                        cleanup();
                    }
                });
            }
        };

        chrome.tabs.onUpdated.addListener(indexPageWhenLoaded);
        chrome.tabs.onRemoved.addListener(handleCloseTab);

        try {
            const tab = await chrome.tabs.create({ url: url });
            tabId = tab.id;
        } catch (e) {
            cleanup();
            reject(`Failed to open tab for ${url}: ${e}`);
        }
    });
};


// update progress
const updateProgress = (percent) => {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressBar.style.width = percent + '%';
    progressText.textContent = percent + '%';
}

// main - index all existing bookmarks
const indexBookmarks = async () => {
    console.log(`reading bookmarks`);

    const bmsList = await getAllBookmarks();

    for (let i = 0; i < bmsList.length; i++) {
        try {
            const pageData = await processPage(bmsList[i].url);
            bmsList[i]['content'] = bmsList[i].title + " \n " + pageData.pageTitle + " \n " + bmsList[i].url + " \n " + pageData.pageContent;
        } catch (e) {
            console.error(`Error processing ${bmsList[i].url}: ${e}`);
            bmsList[i]['content'] = bmsList[i].title + " \n " + bmsList[i].url;
        }
        // Update progress bar in any case, because we passed one more bookmark
        updateProgress(Math.round((i + 1) * 100 / bmsList.length));

        await waitForTime(500);
    }

    console.log(bmsList);

    chrome.runtime.sendMessage({ req: "bms", bms: bmsList }, function (response) {
        console.log(response.farewell);
    });
};

// listeners
document.addEventListener('DOMContentLoaded', async () => {
    console.log(`bm_indexer.js started!`);

    document.querySelector(`#btn_start_index`).onclick = async () => {
        console.log(`starting index`);

        document.querySelector("#btn_start_index").disabled = "true";
        document.querySelector(".progress-container").style.visibility = "visible";
        document.querySelectorAll(`#hint_done`).forEach(e => e.style.display = `none`);
        document.querySelectorAll(`#hint_in_progress`).forEach(e => e.style.display = `block`);

        await indexBookmarks();

        document.querySelectorAll(`#hint_in_progress`).forEach(e => e.style.display = `none`);
        document.querySelectorAll(`#hint_done`).forEach(e => e.style.display = `block`);
    };
});

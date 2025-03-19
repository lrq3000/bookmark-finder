console.log(`bm_pruner.js started!`);

// utility - pause execution for the given time t
const waitForTime = (t) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, t);
    });
};

// update progress
const updateProgress = (percent) => {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressBar.style.width = percent + '%';
    progressText.textContent = percent + '%';
}

// main - prune stale bookmarks
const pruneBookmarks = async () => {
    console.log(`starting prune`);

    document.querySelector("#btn_start_index").disabled = "true";
    document.querySelector(".progress-container").style.visibility = "visible";
    document.querySelectorAll(`#hint_done`).forEach(e => e.style.display = `none`);
    document.querySelectorAll(`#hint_in_progress`).forEach(e => e.style.display = `block`);
    document.querySelectorAll(`#hint_prune_done`).forEach(e => e.style.display = `none`);

    // get indexed bookmarks from background.js
    const response = await chrome.runtime.sendMessage({ req: "getIndexedBookmarks" });
    const indexedBookmarks = response.bms;
    console.log(`indexedBookmarks:`, indexedBookmarks);

    let prunedCount = 0;

    for (let i = 0; i < indexedBookmarks.length; i++) {
        const indexedBm = indexedBookmarks[i];
        const indexedUrl = indexedBm.url;

        // check if bookmark still exists
        const bookmarks = await chrome.bookmarks.search({ url: indexedUrl });
        if (bookmarks.length === 0) {
            console.log(`Stale bookmark found: ${indexedUrl}`);

            // remove stale bookmark from index and bms array in background.js
            const pruneResponse = await chrome.runtime.sendMessage({ req: "prune", url: indexedUrl });
            if (pruneResponse.success) {
                prunedCount += pruneResponse.count;
            }
        }

        // Update progress bar
        updateProgress(Math.round((i + 1) * 100 / indexedBookmarks.length));
    }

    document.querySelectorAll(`#hint_in_progress`).forEach(e => e.style.display = `none`);
    document.querySelectorAll(`#hint_done`).forEach(e => e.style.display = `none`);
    document.querySelector(`#hint_prune_done`).style.display = `block`;
    document.querySelector(`#pruned_count`).textContent = prunedCount;

    console.log(`Pruning completed. ${prunedCount} entries removed.`);
};

// listeners
document.addEventListener('DOMContentLoaded', async () => {
    console.log(`bm_pruner.js started!`);

    document.querySelector(`#btn_start_index`).onclick = async () => {
        console.log(`starting prune`);
        await pruneBookmarks();
    };
});
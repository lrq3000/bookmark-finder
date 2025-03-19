## Implementation Plan for "Prune" Functionality (Revised)

**Objective:** Add a "Prune" button to the Chrome extension's popup to remove indexed bookmarks that are no longer present in the browser bookmarks. Implement the pruning functionality in new files (`bm_pruner.html`, `bm_pruner.js`, `bm_pruner.css`) separate from the indexing functionality.

**Detailed Plan:**

1.  **Create `bm_pruner.html`:**
    *   Create a new file `src/bm_pruner.html` by copying and modifying `src/bm_indexer.html`.
    *   Update the title to "Prune Bookmarks".
    *   Update the heading to "Prune Index for Stale Bookmarks".
    *   Update the hint paragraphs to reflect the pruning process.
    *   Keep the progress bar and "Start" button elements.

2.  **Create `bm_pruner.js`:**
    *   Create a new file `src/bm_pruner.js` by copying and modifying `src/bm_indexer.js`.
    *   Rename the main function from `indexBookmarks` to `pruneBookmarks`.
    *   Modify `pruneBookmarks` function to:
        *   Fetch indexed URLs from `background.js`.
        *   Iterate through each indexed URL and check for bookmark existence using `chrome.bookmarks.search`.
        *   Send a message to `background.js` to remove stale entries from the index and `bms` array.
        *   Update the progress bar.
        *   Display a confirmation message with the number of pruned entries.
    *   Update the event listener for the "Start" button to call `pruneBookmarks` instead of `indexBookmarks`.

3.  **Create `src/css/bm_pruner.css`:**
    *   Create a new file `src/css/bm_pruner.css` by copying `src/css/bm_indexer.css`.
    *   Modify styles if needed for pruning specific UI elements.

4.  **Modify `src/popup.html`:**
    *   Add a new button with `id="btn_prune"` and `value="Prune"` and `class="search-button"` in the `home_page` div, similar to the "Reindex" and "Reset" buttons. Place it after the "Reindex" button.

    ```html
    <input id="btn_reindex" type="submit" value="Reindex" class="search-button" />
    <input id="btn_prune" type="submit" value="Prune" class="search-button" />
    ```

5.  **Modify `src/popup.js`:**
    *   Add an event listener for the "Prune" button (`btn_prune`).
    *   When the "Prune" button is clicked, open `bm_pruner.html` in a new window.

    ```javascript
    document.querySelector(`#btn_prune`).onclick = () => {
        const popupWindow = chrome.windows.create({
            url: chrome.runtime.getURL(`bm_pruner.html`)
        });
    };
    ```

6.  **Modify `src/background.js`:**
    *   **Implement `prune` message handler:** In the `chrome.runtime.onMessage.addListener` in `background.js`, add a new case for `req: "prune"`.
        *   **Retrieve `bms` and `index`:** Access the `bms` array and `lunr` index.
        *   **Receive Indexed URLs:** Expect to receive an array of indexed URLs from `bm_pruner.js` in the message.
        *   **Check Bookmark Existence and Prune:** Implement the logic to iterate through the provided indexed URLs, use `chrome.bookmarks.search` to check for bookmark existence, and remove stale entries from both `bms` and `index`.
        *   **Return Pruned Count:** Return the number of pruned entries in the response to `bm_pruner.js`.
    *   **Implement `getIndexedBookmarks` message handler:** Add a new case for `req: "getIndexedBookmarks"` to send the `bms` array to `bm_pruner.js` so that `pruneBookmarks` can iterate over the indexed URLs.

**Mermaid Diagram:**

```mermaid
graph LR
    A[popup.html] --> B(popup.js);
    B -- "Prune Button Click" --> C[bm_pruner.html];
    C --> D(bm_pruner.js);
    D -- "Start Pruning" --> E{pruneBookmarks()};
    E -- "Get Indexed URLs (req: getIndexedBookmarks)" --> F[background.js];
    F -- "bms array" --> E;
    E -- "Iterate Indexed URLs & Check Bookmarks" --> G{chrome.bookmarks.search()};
    G -- "No Bookmark Found" --> H{Remove Stale Entries};
    H -- "Update index & bms (req: prune)" --> F;
    F -- "Pruned Count" --> E;
    E -- "Update Progress Bar" --> C;
    E -- "Display Confirmation" --> C;
    C --> I[User sees Prune Complete];
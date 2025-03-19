# Bookmark Finder

Bookmark Finder transforms your bookmarked pages with **their contents** into a searchable database, enabling you to discover content through keywords as if operating your very own personal search engine. It ensures that all indexed data is securely stored in your local storage, guaranteeing privacy and speed without the need for external data calls. Experience swift, secure, and efficient searching directly within your browser.

## User Guide

### Installation

#### Install via Chrome Web Store (Recommended)
You can install this [**extension directly via Chrome Web Store**](https://chromewebstore.google.com/detail/bookmark-finder/afnalmifnoilklcknoaaeomnnikainpj?hl=en-US&utm_source=ext_sidebar).

#### Install via Unpacked Zip File
Download the Bookmark Finder Chrome Extension zip file from our [**release page**](https://github.com/Xiaohan-Tian/bookmark-finder/releases). Extract all the files into an empty folder.

To install the Bookmark Finder Chrome Extension in Google Chrome, follow these steps:
1. Open Google Chrome and navigate to `⋮` -> Settings -> Extensions, or open a new tab and enter `chrome://extensions/` in the URL bar.
2. Enable “Developer mode”.
3. Click “Load unpacked” and select the folder where you extracted the files.

![Install via Unpacked Zip](res/01-install-via-unpacked-zip.png?raw=true "Install via Unpacked Zip")

### Using Bookmark Finder

#### Pin the Bookmark Finder to the URL Bar (Optional)
For quick access to the Bookmark Finder extension, we recommend pinning it to the URL bar:
1. Click the Extensions icon.
2. Find the Bookmark Finder extension and click the Pin button on the right side.

![Pin the Extension](res/02-pin.png?raw=true "Pin the Extension")

#### Building the Index
Before searching your bookmarked pages, you need to build the index for your existing bookmarks (new bookmarks added after installation will be automatically indexed; this step can be skipped if you have no existing bookmarks). To build the index:
1. Click the Bookmark Finder icon.
2. Click the "Reindex" button to open the "Index Bookmarks" window.

![Open Reindex Window](res/03-reindex-1.png?raw=true "Open Reindex Window")

3. On the "Index Bookmarks" page, click the "Start" button to begin the indexing process. The Bookmark Finder add-on will sequentially open and index the contents of your existing bookmarked pages. The duration of this process depends on the number of pages bookmarked and their loading speeds. Please refrain from closing the window until the progress bar reaches 100%.

![Index bookmarked pages](res/03-reindex-2.png?raw=true "Index bookmarked pages")

#### Search Bookmarked Pages
Easily search among your bookmarked pages by using keywords. To conduct a search:
1. Click the Bookmark Finder Extension icon.
2. Type your search keyword(s) into the input box.
3. Press the "Search" button or the "Enter" (Windows)/"Return" (macOS) key to initiate the search.

![Search](res/04-search-1.png?raw=true "Search")

4. The search result page will display all bookmarked pages containing the keyword(s). Clicking on the title or URL of each page will open it in a new tab.

![Search](res/04-search-2.png?raw=true "Search")

Note that the indexing is very basic and literal, there is no natural language processing, no stemming. This means that searching for "can" will not match "can't" as they will be considered as two different words. Same for "l'armure" and "armure".

## Notes

- Bookmark Finder utilizes a third-party library for the client-side search index feature: [**Lunr.js**](https://github.com/olivernn/lunr.js)
- You can start indexing new bookmarks without reindexing old ones if you want to use the extension asap without waiting. Just create a new bookmark, and it will be indexed.

## Known limitations
- once a bookmark is added, it is forever indexed until the database is reset or reindexed. Indeed, deleted bookmarks will remain indexed. This is because we cannot know if the user deleted a bookmark that was a duplicate, and hence they want to keep the bookmark indexed, or whether it is a true deletion, without any other copy. So by default, to be on the safe side, everything is kept unless the user specifically deletes the database.
- There is no database export nor import. However, the database can be rebuilt at anytime given the same bookmarks set, by using the reindex button. Hence, the bookmarks are your real database, and this extension simply builds an index over it at any point in time, so the lack of an export/import feature is just an inconvenience, as the reindexing can be quite time consuming.

## License

Apache License Version 2.0.

## Authors

This is a fork of Xiaohan Tian's original work: https://github.com/Xiaohan-Tian/bookmark-finder

This fork is developed and maintained by Stephen Karl Larroque at https://github.com/lrq3000/bookmark-finder

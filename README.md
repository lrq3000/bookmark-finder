# Bookmark Finder
Bookmark Finder transforms your bookmarked pages into a searchable database, enabling you to discover them through keywords as if operating your very own personal search engine. It guarantees that all indexed data is stored securely in your local storage, ensuring privacy and speed without the need for external data calls. Experience swift, secure, and efficient searching directly within your browser.

## User Guide

### Installation

#### Install via Chrome Web Store (Recommended)
(Upcoming)

#### Install via Unpacked Zip File
Download the Bookmark Finder Chrome Extension zip file from the [**release page**](https://github.com/Xiaohan-Tian/bookmark-finder/releases). Unzip all the files to a empty folder.

Install the Bookmark Finder Chrome Extension in Google Chrome:
1. Open Google Chrome, then click `⋮` -> Settings -> Extensions (or open a new tab and input `chrome://extensions/` on the URL bar)
2. Enable “Developer mode”.
3. Click “Load unpacked” and select the folder where you unzipped the files.

![Install via Unpacked Zip](res/01-install-via-unpacked-zip.png?raw=true "Install via Unpacked Zip")

### Using the Bookmark Finder

#### Pin the Bookmark Finder to the URL Bar (Optional)
In order to have quick access to Bookmark Finder extension, it is recommended to pin it to the URL bar:
1. Click the Extension icon.
2. Click the Pin button on the right side of the Bookmark Finder extension.

![Pin the Extension](res/02-pin.png?raw=true "Pin the Extension")

#### Building the Index
You need to build the index for your existing bookmarked pages before you search them (new bookmarks after the installation will be automatically indexed. If you don't have any existing bookmark, this step can be skipped). To build the index:
1. Click the Bookmark Finder icon
2. Click the "Reindex" button to open the "Index Bookmarks" window

![Open Reindex Window](res/03-reindex-1.png?raw=true "Open Reindex Window")

3. Click the "Start" button on the "Index Bookmarks" page to start the indexing process. During this procedure, Bookmark Finder add-on will open all your existing bookmarked pages sequencially and index their contents, the whole process might take some time. The total time consomption depends on the number of pages you have bookmarked and the loading speed as well. Please DO NOT close this window until the progress bar reaches to 100%.

![Index bookmarked pages](res/03-reindex-2.png?raw=true "Index bookmarked pages")

#### Search Bookmarked Pages
You can easily search among your bookmarked pages by using keywords. To perform a search:
1. Click the Bookmark Finder Extension icon
2. Type the keyword(s) you would like to search in the input box
3. Click the "Search" button or press "Enter (Windows)"/"Return (macOS)" key to perform the search.

![Search](res/04-search-1.png?raw=true "Search")

4. On the search result page, it will list all the bookmarked pages contains the keyword(s). Click the title or the URL of each page will open that page in a new tab

## Notes

- Bookmark Finder uses a third party libary for the client-side search index feature: [**Lunr.js**](https://github.com/olivernn/lunr.js)



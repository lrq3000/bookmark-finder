// general full-text search query
const queryKeywords = (queryString) => {
    const keywords = queryString ? queryString.trim() : null;
    console.log(`keywords = ${keywords}`);

    document.querySelector(`#text_query_alter`).value = keywords;

    if (keywords) {
        document.querySelectorAll(`.home_page`).forEach(e => e.style.display = `none`);
        document.querySelectorAll(`.result_page`).forEach(e => e.style.display = `block`);

        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ req: "search", keywords: keywords }, function (response) {
                console.log(response.result);
                resolve(response);
            });
        });
    }
    else {

    }
};

// highlight matched terms in the text snippet
const highlightKeywords = (metadataMap, text) => {
    const neighborLength = 64;

    // get all the positions
    const positions = [];

    for (let match in metadataMap) {
        const metadata = metadataMap[match];
        positions.push(metadata.content.position[0]);
    }

    positions.sort((a, b) => {
        if (a[0] > b[0]) {
            return 1;
        }
        else if (a[0] < b[0]) {
            return -1;
        }
        else {
            return 0;
        }
    });

    // console.log(positions);

    // begin construct text snippet
    let content = ``;
    let ignoreTrail = false;

    for (let i = 0; i < positions.length; i++) {
        const currPos = positions[i];

        if (!ignoreTrail) {
            content += `...`;

            const begin = currPos[0] - neighborLength > 0 ? currPos[0] - neighborLength : 0;
            content += text.substring(begin, currPos[0]);
        }

        ignoreTrail = false;
        content += `<b>${text.substr(currPos[0], currPos[1])}</b>`;

        if (i + 1 < positions.length) {
            const nextPos = positions[i + 1];

            if (currPos[0] + currPos[1] + neighborLength > nextPos[0]) {
                ignoreTrail = true;
                content += text.substring(currPos[0] + currPos[1], nextPos[0]);
            }
        }

        if (!ignoreTrail) {
            let end = currPos[0] + currPos[1] + neighborLength > text.length ? text.length : currPos[0] + currPos[1] + neighborLength;
            content += text.substring(currPos[0] + currPos[1], end);
            content += `...`;
        }
    }

    return content;
};

// generate dynamic HTML for displaying query result
const handleQueryResult = (res) => {
    console.log(`btn_query = ${res}`);

    let content = ``;

    // query result
    if (res && res.noIndex) {
        content += `
            <li class="search-result">
                <h3>No Index Data</h3>
                <p class="snippet">Sorry, it seems you never build your index before, please click <a href='#' class='btn_reindex_alter'">Rebuild Index</a> to build your index. Note this only need to be done once after you installed this extension.</p>
            </li>
        `;
    }
    else if (res && res.result && res.result.length > 0) {
        res.result.forEach(o => {
            content += `
                <li class="search-result">
                    <h3><a href="${o.bm.url}" title="${o.bm.title}" target="_blank">${o.bm.title}</a></h3>
                    <div class="url"><a href="${o.bm.url}" title="${o.bm.url}" target="_blank">${o.bm.url}</a></div>
                    <p class="snippet">${highlightKeywords(o.matchData.metadata, o.bm.content)}</p>
                </li>
            `;
        });

        // recommendations
        // if (res && res.recommendations && res.recommendations.length > 0) {
        //     content += `<div class="result_row hr">Recommendations</div>`;

        //     res.recommendations.forEach(o => {
        //         content += `
        //         <div class="result_row">
        //             <p>${o.bm.title}</p>
        //             <p><a href="${o.bm.url}" target="_blank">${o.bm.url}</a></p>
        //         </div>
        //     `;
        //     });
        // }
    }
    else {
        content += `
            <li class="search-result">
                <h3>No Result</h3>
                <p class="snippet">Sorry, it seems there is no bookmarked page is related to your query string.</p>
            </li>
        `;
    }

    document.querySelector(`#result_container`).innerHTML = content;

    const btnReindexAlther = document.querySelector(`.btn_reindex_alter`);
    if (btnReindexAlther) {
        btnReindexAlther.onclick = () => {
            const popupWindow = chrome.windows.create({
                url: chrome.runtime.getURL(`bm_indexer.html`)
            });
        };
    }
};

// button - rebuild index
const resetIndex = () => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ req: "reset" }, function (response) {
            resolve(response);
        });
    });
};

const handleResetResult = (res) => {
    console.log(`reset done: ${JSON.stringify(res)}`);
};

const btnRebuildIndexAlterClicked = () => {
    const popupWindow = chrome.windows.create({
        url: chrome.runtime.getURL(`bm_indexer.html`)
    });
};

// Listeners
document.addEventListener('DOMContentLoaded', async () => {
    console.log(chrome.runtime.getURL(`bm_indexer.html`));

    const inputBox = document.getElementById('text_query');
    if (inputBox) {
        inputBox.focus();
    }

    document.getElementById('text_query').addEventListener("keyup", function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            document.getElementById('btn_query').click();
        }
    });

    document.getElementById('text_query_alter').addEventListener("keyup", function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            document.getElementById('btn_query_alter').click();
        }
    });

    document.querySelector(`#btn_reindex`).onclick = () => {
        const popupWindow = chrome.windows.create({
            url: chrome.runtime.getURL(`bm_indexer.html`)
        });
    };

    document.querySelector(`#btn_query`).onclick = () => {
        Promise.resolve(queryKeywords(document.querySelector(`#text_query`).value)).then(handleQueryResult);
    };

    document.querySelector(`#btn_query_alter`).onclick = () => {
        Promise.resolve(queryKeywords(document.querySelector(`#text_query_alter`).value)).then(handleQueryResult);
    };

    document.querySelector(`#btn_reset`).onclick = () => {
        if (window.confirm("This button will delete the whole database. Continue?")) {
            Promise.resolve(resetIndex()).then(handleResetResult);
        }
    };

    document.querySelector(`#result_page_logo`).onclick = () => {
        document.querySelectorAll(`.home_page`).forEach(e => e.style.display = `block`);
        document.querySelectorAll(`.result_page`).forEach(e => e.style.display = `none`);

        if (inputBox) {
            inputBox.focus();
        }
    };
});

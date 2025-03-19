importScripts('./lib/lunr.js');

console.log(lunr);
console.log(`background.js started!`);

let index = null;
let bms = null;

// constants
const constants = {
  SAVED_INDEX: "PSE_SAVED_INDEX",
  SAVED_BMS: "PSE_SAVED_BMS",
  maxRefResult: 3,
  maxBowKeyword: 3,
  maxReommendation: 3
};

// global status
const status = {
  INDEXED: false
};

// === === 3rd Party Utilities === ===
// Utility Method - UUID Generator
// Credit: 
// https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
const uuid = () => {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

// Utility Method - Wrap Chrome Event Listener into Async Functions
// Credit:
// https://stackoverflow.com/questions/44056271/chrome-runtime-onmessage-response-with-async-await
const wrapAsyncFunction = (listener) => (request, sender, sendResponse) => {
  // the listener(...) might return a non-promise result (not an async function), so we wrap it with Promise.resolve()
  Promise.resolve(listener(request, sender)).then(sendResponse);
  return true; // return true to indicate you want to send a response asynchronously
};

// === === === === === === Bookmark Finder - Main Logic === === === === === === 
// persist given key-value pair to browser local storage
const saveToLocalStorage = (key, value) => {
  const o = {};
  o[key] = value;

  return new Promise((resolve, reject) => {
    chrome.storage.local.set(o, function () {
      console.log(`saved to local storage, ${key} = ${value}`);
      resolve(`done`);
    });
  });
};

// load value from browser local storage by key
const loadFromLocalStorage = (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function (result) {
      console.log(`load from local storage, ${key} = ${JSON.stringify(result[key])}`);
      resolve(result[key]);
    });
  });
};

// erase key-value value from browser local storage by key
const removeFromLocalStorage = (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove([key], function (result) {
      console.log(`removed from local storage, ${key} = ${JSON.stringify([key])}`);
      resolve([key]);
    });
  });
};

// pre-processing pipeline: tokenize -> trim -> remove stop words -> stem 
const convertDocToTerms = (doc) => {
  let tokens = lunr.tokenizer(doc, {});

  tokens = tokens.map((token) => {
    token = lunr.trimmer(token);
    token = lunr.stopWordFilter(token);

    if (token) {
      token = lunr.stemmer(token);
    }

    return token;
  });

  tokens = tokens.filter((token) => token && token.str);

  return tokens;
};

// convert doc to Bag-of-Words representation
const convertDocToBOW = (doc) => {
  const terms = convertDocToTerms(doc);
  const bowMap = {};
  const bow = [];

  terms.forEach((term) => {
    // console.log(term.str);
    if (bowMap[term.str]) {
      bowMap[term.str] += 1;
    }
    else {
      bowMap[term.str] = 1;
    }
  });

  for (let term in bowMap) {
    bow.push({
      term: term,
      count: bowMap[term]
    })
  }

  bow.sort((a, b) => {
    if (a.count > b.count) {
      return -1;
    }
    else if (a.count < b.count) {
      return 1;
    }
    else {
      return 0;
    }
  });

  return bow;
};

// load inverted index from browser local storage in JSON format
const getIndex = async () => {
  if (!index) {
    // load default index
    try {
      const indexJson = await loadFromLocalStorage(constants.SAVED_INDEX);
      if (indexJson) {
        index = lunrMutable.Index.load(JSON.parse(indexJson));
        console.log(`saved index has been loaded`);
      }

      const bmsJson = await loadFromLocalStorage(constants.SAVED_BMS);
      if (bmsJson) {
        bms = JSON.parse(bmsJson);
      }
    }
    catch (e) {
      console.log(e);
      status.index = false;
    }
  }

  if (!bms) { // Initialize bms if it's null (in case we are indexing newly created bookmarks without a full reindex of past bookmarks first)
    bms = [];
  }

  return index;
};

// rebuild the inverted index for all existing bookmarks
const reindex = async (request, sender) => {
  console.log(`processing bookmarks`);

  bms = request.bms;

  index = lunrMutable(function () {
    this.ref(`uuid`);
    this.field(`content`);
    this.metadataWhitelist = ['position'];
  });

  if (request.bms && request.bms.length > 0) {
    request.bms.forEach(function (doc) {
      // generate UUID
      doc['uuid'] = uuid();

      // add to index
      index.add(doc);
    });
  }
  console.log(request.bms);

  // test query
  // const result = index.search("coursera");
  // console.log(result);

  // save index
  await saveToLocalStorage(constants.SAVED_INDEX, JSON.stringify(index));
  await saveToLocalStorage(constants.SAVED_BMS, JSON.stringify(bms));

  return { farewell: "bookmarks have been indexed!" };
};

// recommend related docs to the user by using blinded feedback method
const recommend = async (result, resultUUIDs) => {
  console.log(`finding recommendations ...`);

  const maxRefResult = constants.maxRefResult;
  const maxBowKeyword = constants.maxBowKeyword;
  const maxReommendation = constants.maxReommendation;

  let refDoc = ``;

  result.slice(0, maxRefResult > result.length ? result.length : maxRefResult).forEach(o => {
    refDoc += o.bm.content;
    refDoc += ` `;
  });

  const bow = convertDocToBOW(refDoc);
  console.log(bow);

  let recommKw = ``;
  content = ``;

  bow.slice(0, maxBowKeyword > bow.length ? bow.length : maxBowKeyword).forEach(o => {
    recommKw += o.term;
    recommKw += ` `;
  });

  console.log(`recommKw = ${recommKw}`);
  const recommendations = index.search(recommKw);

  if (recommendations && recommendations.length > 0 && bms && bms.length > 0) {
    recommendations.forEach((rec) => {
      const bm = bms.find(o => o.uuid == rec.ref);
      rec['bm'] = bm;
    });
  }

  const filteredRecomm = [];

  if (recommendations && recommendations.length > 0) {
    for (let i = 0; i < recommendations.length; i++) {
      const o = recommendations[i];

      if (resultUUIDs.includes(o.ref)) {
        continue;
      }

      filteredRecomm.push(o);

      if (filteredRecomm.length >= maxReommendation) {
        break;
      }
    }
  }

  return filteredRecomm
};

// perform general full-text search
const query = async (request, sender) => {
  console.log(`query keywords`);

  const index = await getIndex();
  console.log("Index in query:", index); // ADDED LOG

  // validation
  if (!index) {
    return { noIndex: true };
  }

  // query result
  console.log("Keywords in query:", request.keywords); // ADDED LOG
  const result = index.search(request.keywords);
  console.log("Search result:", result); // ADDED LOG

  // append bookmark content
  const resultUUIDs = [];
  if (result && result.length > 0 && bms && bms.length > 0) {
    result.forEach((rec) => {
      resultUUIDs.push(rec.ref);
      const bm = bms.find(o => o.uuid == rec.ref);
      rec['bm'] = bm;
    });
  }

  // recommendations
  const filteredRecomm = await recommend(result, resultUUIDs);

  console.log(filteredRecomm);

  return { result: result, recommendations: filteredRecomm };
};

function getTitle() {
  return document.title;
}

// capture page content from a HTML webpage
function getContent() {
  const el = document.querySelector(`*`);
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNode(el);
  selection.removeAllRanges();
  selection.addRange(range);
  return window.getSelection().toString();
}

// inject "getContent()" to webpage and execute. 
// wrap it as a JS promise
const promiseGetPage = () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab[0].id, allFrames: false },
          func: getContent,
        },
        (injectionResult) => {
          if (injectionResult && injectionResult.length > 0) {
            resolve({
              title: tab[0].title,
              url: tab[0].url,
              content: injectionResult[0].result
            });
          }
          else {
            reject(`failed to capture content from ${tab.url}`);
          }
        });
    });
  });
};

// main
chrome.runtime.onMessage.addListener(
  wrapAsyncFunction(async (request, sender) => {
    if (request.req == "bms") {
      return await reindex(request, sender);
    }
    else if (request.req == "search") {
      return await query(request, sender);
    }
    else if (request.req == "reset") {
      console.log("Resetting index and bookmarks..."); // ADDED LOG
      await removeFromLocalStorage(constants.SAVED_INDEX);
      await removeFromLocalStorage(constants.SAVED_BMS);
      console.log("Index and bookmarks removed from local storage."); // ADDED LOG

      return { success: "done" };
    }
  })
);

// listener - new bookmark added
chrome.bookmarks.onCreated.addListener((id, newBmNode) => {
  Promise.resolve((async () => {
    console.log(`adding new bm on-the-fly`);
    // retrieve the current index from local storage.
    if (!index) { // Check if index is null (not yet created)
      // Create a new empty index
      // This allows to start indexing newly created bookmarks even if we did not index past ones via a full reindex (very time consuming)
      index = lunrMutable(function () {
        this.ref(`uuid`);
        this.field(`content`);
        this.metadataWhitelist = ['position'];
      });
      console.log(`default empty index created on first bookmark`);
    }
    index = await getIndex();
    // capture the content of the newly bookmarked page. This function opens the bookmark URL in a tab (briefly), executes content scripts to extract the title and content, and then closes the tab.
    let pageContent = { content: "" }; // Default empty content
    try { // this may fail if tab is opened by another extension (eg, suspended tab)
      pageContent = await promiseGetPage();
      console.log(pageContent);
    } catch (error) {
      console.warn("Failed to get page content:", error);
      // Use default empty content
    }

    const newBm = {
      title: newBmNode.title, // Bookmark title
      url: newBmNode.url,     // Bookmark URL
      content: pageContent.content ? `${newBmNode.title} ${pageContent.title} ${pageContent.content} ${newBmNode.url} ${pageContent.url}` : `${newBmNode.title} ${newBmNode.url}` // Index both the page content if available, but also the page title, the bookmark title and bookmark URL, but fallback to only bookmark data in case the pageContent is inaccessible (eg, suspended tab, because we cannot access the content of pages created by other extensions)
    };

    // generate UUID for new bookmark
    newBm['uuid'] = uuid();
    // add new bookmark newBm to the Lunr index
    index.add(newBm);
    // and add to bms array
    bms.push(newBm);

    // save to persist index into local storage
    await saveToLocalStorage(constants.SAVED_INDEX, JSON.stringify(index));
    await saveToLocalStorage(constants.SAVED_BMS, JSON.stringify(bms));
  })()).then(() => {
    console.log(`bookmark has been added.`);
  });
});

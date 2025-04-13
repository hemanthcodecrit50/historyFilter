function getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  }
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getFilteredHistory") {
      chrome.storage.sync.get({ exceptionList: [] }, ({ exceptionList }) => {
        chrome.history.search({ text: '', maxResults: 1000 }, (results) => {
          const latestByKey = {};
  
          for (const item of results) {
            const url = item.url;
            const domain = getDomain(url);
            const isException = exceptionList.some(ex => url.startsWith(ex));
            const key = isException ? url : domain;
  
            if (!latestByKey[key] || item.lastVisitTime > latestByKey[key].lastVisitTime) {
              latestByKey[key] = item;
            }
          }
  
          const filtered = Object.values(latestByKey).sort(
            (a, b) => b.lastVisitTime - a.lastVisitTime
          );
  
          sendResponse({ history: filtered });
        });
      });
  
      return true; // keep async response alive
    }
  });
  
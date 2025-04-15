chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getFilteredHistory") {
    chrome.storage.sync.get({ exceptionList: [] }, ({ exceptionList }) => {
      chrome.history.search({ text: '', maxResults: 1000 }, (results) => {
        const latestByDomain = {};
        const exceptionEntries = [];

        results.forEach(item => {
          const url = item.url;
          const domain = new URL(url).hostname;
          const isException = exceptionList.some(ex => url.includes(ex));

          if (isException) {
            exceptionEntries.push(item); // collect all matches
          } else {
            if (!latestByDomain[domain] || item.lastVisitTime > latestByDomain[domain].lastVisitTime) {
              latestByDomain[domain] = item;
            }
          }
        });

        // Combine results
        const filtered = [
          ...exceptionEntries,
          ...Object.values(latestByDomain)
        ].sort((a, b) => b.lastVisitTime - a.lastVisitTime);

        sendResponse({ history: filtered });
      });
    });

    return true;
  }
});

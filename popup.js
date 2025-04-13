// Format visit time into "13th April, 2:45 PM"
function formatVisitTime(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
  
    const suffix = (d) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
  
    return `${day}${suffix(day)} ${month}, ${hour12}:${minutes} ${ampm}`;
  }
  
  // Load and render filtered history
  function loadFilteredHistory() {
    chrome.runtime.sendMessage({ action: "getFilteredHistory" }, (response) => {
      const tableBody = document.querySelector('#history-table tbody');
      tableBody.innerHTML = '';
  
      chrome.storage.sync.get({ exceptionList: [] }, ({ exceptionList }) => {
        response.history.forEach(entry => {
          const tr = document.createElement('tr');
  
          const isException = exceptionList.some(ex => entry.url.startsWith(ex));
          const type = isException ? "Full URL" : "Domain";
  
          tr.innerHTML = `
            <td><a href="${entry.url}" target="_blank">${entry.title || entry.url}</a></td>
            <td>${type}</td>
            <td>${formatVisitTime(entry.lastVisitTime)}</td>
          `;
  
          tableBody.appendChild(tr);
        });
      });
    });
  }
  
  // Load exception list
  function loadExceptionList() {
    const listEl = document.getElementById('exception-list');
    chrome.storage.sync.get({ exceptionList: [] }, ({ exceptionList }) => {
      listEl.innerHTML = '';
      exceptionList.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'exception-item';
        li.innerHTML = `
          <span>${item}</span>
          <button data-index="${index}">Remove</button>
        `;
        listEl.appendChild(li);
      });
    });
  }
  
  // Add a new exception
  document.getElementById('add-exception').addEventListener('click', () => {
    const input = document.getElementById('exception-input');
    const value = input.value.trim();
    if (!value) return;
  
    chrome.storage.sync.get({ exceptionList: [] }, ({ exceptionList }) => {
      if (!exceptionList.includes(value)) {
        exceptionList.push(value);
        chrome.storage.sync.set({ exceptionList }, () => {
          input.value = '';
          loadExceptionList();
          loadFilteredHistory();
        });
      }
    });
  });
  
  // Remove an exception
  document.getElementById('exception-list').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const index = parseInt(e.target.dataset.index);
      chrome.storage.sync.get({ exceptionList: [] }, ({ exceptionList }) => {
        exceptionList.splice(index, 1);
        chrome.storage.sync.set({ exceptionList }, () => {
          loadExceptionList();
          loadFilteredHistory();
        });
      });
    }
  });
  
  // On popup load
  document.addEventListener('DOMContentLoaded', () => {
    loadFilteredHistory();
    loadExceptionList();
  });
  
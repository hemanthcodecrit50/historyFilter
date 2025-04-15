function formatTime(timestamp) {
  const date = new Date(timestamp);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;

  const getOrdinal = n => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return `${day}${getOrdinal(day)} ${month}, ${hour12}:${minutes}${suffix}`;
}

function loadHistory() {
  chrome.runtime.sendMessage({ action: "getFilteredHistory" }, response => {
    chrome.storage.sync.get({ exceptionList: [] }, ({ exceptionList }) => {
      const tableBody = document.querySelector('#history-table tbody');
      tableBody.innerHTML = '';

      response.history.forEach(entry => {
        const url = entry.url;
        const type = exceptionList.some(ex => url.includes(ex)) ? "Full URL" : "Domain";

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><a href="${url}" target="_blank">${entry.title || url}</a></td>
          <td>${type}</td>
          <td>${formatTime(entry.lastVisitTime)}</td>
        `;
        tableBody.appendChild(row);
      });
    });
  });
}

function addException(url) {
  if (!url) return;
  chrome.storage.sync.get({ exceptionList: [] }, ({ exceptionList }) => {
    if (!exceptionList.includes(url)) {
      exceptionList.push(url);
      chrome.storage.sync.set({ exceptionList }, loadExceptions);
    }
  });
}

function removeException(url) {
  chrome.storage.sync.get({ exceptionList: [] }, ({ exceptionList }) => {
    const newList = exceptionList.filter(item => item !== url);
    chrome.storage.sync.set({ exceptionList: newList }, loadExceptions);
  });
}

function loadExceptions() {
  chrome.storage.sync.get({ exceptionList: [] }, ({ exceptionList }) => {
    const list = document.getElementById('exception-list');
    list.innerHTML = '';
    exceptionList.forEach(item => {
      const li = document.createElement('li');
      li.className = 'exception-item';
      li.innerHTML = `
        <span>${item}</span>
        <button data-url="${item}">Remove</button>
      `;
      list.appendChild(li);
    });

    document.querySelectorAll('.exception-item button').forEach(btn => {
      btn.addEventListener('click', () => {
        removeException(btn.dataset.url);
      });
    });

    loadHistory(); // reload after exception update
  });
}

document.getElementById('add-exception').addEventListener('click', () => {
  const input = document.getElementById('exception-input');
  const value = input.value.trim();
  addException(value);
  input.value = '';
});

window.addEventListener('DOMContentLoaded', () => {
  loadExceptions();
  loadHistory();
});

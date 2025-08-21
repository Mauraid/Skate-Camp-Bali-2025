// script.js

async function loadSchedule() {
  const url = "https://docs.google.com/spreadsheets/d/18WdzRt6x_fRbAzm9NBzFtmMr9xZW9Ishu5jPqz3uQQE/gviz/tq?tqx=out:json&gid=0";
  const res = await fetch(url);
  let text = await res.text();
  // Strip the JSONP wrapper
  const jsonText = text.match(/google\.visualization\.Query\.setResponse\((.*)\)/s)[1];
  const data = JSON.parse(jsonText);
  const cols = data.table.cols.map(c => c.label);
  const rows = data.table.rows.map(r => r.c.map(cell => (cell && cell.v) || ""));
  renderTable(cols, rows);
}

function renderTable(headers, rows) {
  const container = document.getElementById("schedule");
  const table = document.createElement("table");
  table.cellPadding = 8;
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  // Header row
  const thead = table.createTHead();
  const thr = thead.insertRow();
  headers.forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    th.style.borderBottom = "2px solid #333";
    th.style.textAlign = "left";
    thr.appendChild(th);
  });
  // Rows
  rows.forEach(row => {
    const tr = table.insertRow();
    row.forEach(cell => {
      const td = tr.insertCell();
      td.textContent = cell;
      td.style.borderBottom = "1px solid #ccc";
    });
  });
  container.appendChild(table);
}

window.addEventListener("DOMContentLoaded", loadSchedule);


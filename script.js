// script.js

const googleSheetUrls = [
    // This URL fetches the first sheet as CSV, which likely corresponds to "Path 1"
    { id: 'path1', name: 'Path 1 Schedule', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSqRHc06sDjAFqbu41pzeJK0QHB9YSovLUaRhBu7tbsMcpiZJgH-JAOuJUi-Omy8-6TUdDeGNp0-RXg/pub?output=csv' },
    // Path 2 URL provided by the user
    { id: 'path2', name: 'Path 2 Schedule', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSqRHc06sDjAFqbu41pzeJK0QHB9YSovLUaRhBu7tbsMcpiZJgH-JAOuJUi-Omy8-6TUdDeGNp0-RXg/pub?gid=122183591&single=true&output=csv' },
    // Kids Path URL added as requested
    { id: 'kids-path', name: 'Kids Path Schedule', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSqRHc06sDjAFqbu41pzeJK0QHB9YSovLUaRhBu7tbsMcpiZJgH-JAOuJUi-Omy8-6TUdDeGNp0-RXg/pub?gid=1377983576&single=true&output=csv' }
];

const tabNavigation = document.getElementById('tab-navigation');
const mainContent = document.querySelector('main');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');

// Modal elements
const sessionModal = document.getElementById('sessionModal');
const closeModalButton = document.getElementById('closeModalButton');
const modalSessionName = document.getElementById('modalSessionName');
const modalTime = document.getElementById('modalTime');
const modalInstructor = document.getElementById('modalInstructor');
const modalLocation = document.getElementById('modalLocation');
const modalDescription = document.getElementById('modalDescription');


// Function to show a specific tab
function showTab(tabId) {
    // Get all tab buttons and content sections dynamically
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Remove 'active' class from all buttons and content
    tabButtons.forEach(button => button.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Add 'active' class to the clicked button and its corresponding content
    document.getElementById(tabId).classList.add('active');
    document.getElementById('content-' + tabId.replace('tab-', '')).classList.add('active');
}

// Function to parse CSV data into an array of arrays
function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== ''); // Split by new line, remove empty lines
    if (lines.length === 0) return [];

    const data = lines.map(line => {
        // Simple CSV parsing: split by comma.
        // This might need more robust parsing for commas within quoted fields.
        return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')); // Trim and remove quotes
    });
    return data;
}

// Function to create a table from data
function createTableHtml(headers, rows, tabTitle, headerColorClass) {
    let tableHtml = `<h2 class="text-3xl font-bold text-gray-800 mb-4">${tabTitle}</h2>`;
    tableHtml += `<table class="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">`;
    tableHtml += `<thead class="${headerColorClass} text-white"><tr>`;
    headers.forEach((header, index) => {
        const cornerClass = index === 0 ? 'rounded-tl-lg' : (index === headers.length - 1 ? 'rounded-tr-lg' : '');
        tableHtml += `<th class="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider ${cornerClass}">${header}</th>`;
    });
    tableHtml += `</tr></thead><tbody class="divide-y divide-gray-200">`;

    rows.forEach(row => {
        // Assume the first column is always 'Time'
        const time = row[0];
        tableHtml += `<tr>`;
        row.forEach((cell, index) => {
            const dataLabel = headers[index] || ''; // Use header for data-label
            // If it's a daily session cell (not the time column)
            if (index > 0 && cell.trim() !== '') {
                // Add data attributes for the modal
                tableHtml += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 session-cell cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out" 
                                data-label="${dataLabel}" 
                                data-session-name="${cell}" 
                                data-session-time="${time}"
                                data-session-day="${headers[index]}">
                                ${cell}
                              </td>`;
            } else {
                tableHtml += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-label="${dataLabel}">${cell}</td>`;
            }
        });
        tableHtml += `</tr>`;
    });
    tableHtml += `</tbody></table>`;
    return tableHtml;
}

// Function to fetch and render Google Sheet data
async function fetchGoogleSheetData() {
    loadingSpinner.classList.remove('hidden'); // Show loading spinner
    errorMessage.classList.add('hidden'); // Hide error message

    // Clear previously loaded dynamic content (if any)
    document.querySelectorAll('.dynamic-tab-button').forEach(btn => btn.remove());
    document.querySelectorAll('.dynamic-tab-content').forEach(content => content.remove());


    for (const sheet of googleSheetUrls) {
        try {
            const response = await fetch(sheet.url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            const data = parseCSV(csvText);

            if (data.length > 0) {
                const headers = data[0]; // First row as headers
                const rows = data.slice(1); // Rest of the rows as data

                let headerColor;
                if (sheet.id === 'path1') {
                    headerColor = 'bg-blue-600';
                } else if (sheet.id === 'path2') {
                    headerColor = 'bg-purple-600';
                } else if (sheet.id === 'kids-path') {
                    headerColor = 'bg-green-600'; // New color for Kids Path
                } else {
                    headerColor = 'bg-gray-600'; // Default color for any other paths
                }

                const tableHtml = createTableHtml(headers, rows, sheet.name, headerColor);

                // Create new tab button
                const newButton = document.createElement('button');
                newButton.id = `tab-${sheet.id}`;
                newButton.className = 'tab-button dynamic-tab-button px-6 py-3 rounded-full text-base font-medium transition-all duration-300 ease-in-out hover:bg-blue-100 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500';
                newButton.textContent = sheet.name;
                tabNavigation.appendChild(newButton);

                // Create new tab content div
                const newContentDiv = document.createElement('div');
                newContentDiv.id = `content-${sheet.id}`;
                newContentDiv.className = 'tab-content dynamic-tab-content p-4 rounded-lg bg-gray-50 border border-gray-200 responsive-table';
                newContentDiv.innerHTML = tableHtml;
                mainContent.appendChild(newContentDiv);
            }
        } catch (error) {
            console.error(`Could not fetch data for ${sheet.name}:`, error);
            errorMessage.classList.remove('hidden'); // Show error message if any fetch fails
        }
    }
    loadingSpinner.classList.add('hidden'); // Hide loading spinner

    // After dynamically adding tabs, re-attach event listeners to ALL tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.removeEventListener('click', showTabHandler); // Remove old listener if exists
        button.addEventListener('click', showTabHandler);
    });

    // Re-select all tab buttons and content and show the default tab
    showTab('tab-intro');
}

// Event handler wrapper for dynamically added buttons
function showTabHandler(event) {
    showTab(event.currentTarget.id);
}

// Function to open the session modal
function openSessionModal(sessionName, time, day) {
    // Mock data for instructor and location since it's not in the current sheet format
    const instructor = "Expert Coach " + (Math.random() > 0.5 ? "Bali" : "Skate"); // Simple mock
    const location = "Canggu Skate Park (" + day + ")"; // Simple mock

    modalSessionName.textContent = sessionName;
    modalTime.textContent = time;
    modalInstructor.textContent = instructor;
    modalLocation.textContent = location;
    modalDescription.textContent = `Get ready for an exciting "${sessionName}" session! This session focuses on [specific details related to session, if available]. We'll be working on [skills, tricks, or activities].`; // Example description

    sessionModal.classList.add('active'); // Show modal
}

// Function to close the session modal
function closeSessionModal() {
    sessionModal.classList.remove('active'); // Hide modal
}

// Event listener for opening modal by clicking session cells
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('session-cell')) {
        const sessionName = event.target.dataset.sessionName;
        const sessionTime = event.target.dataset.sessionTime;
        const sessionDay = event.target.dataset.sessionDay;
        openSessionModal(sessionName, sessionTime, sessionDay);
    }
});

// Event listener for closing modal
closeModalButton.addEventListener('click', closeSessionModal);
sessionModal.addEventListener('click', function(event) {
    // Close modal if clicked outside the content area
    if (event.target === sessionModal) {
        closeSessionModal();
    }
});

// Call the function to fetch data when the DOM is loaded
document.addEventListener('DOMContentLoaded', fetchGoogleSheetData);

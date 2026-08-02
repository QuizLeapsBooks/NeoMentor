const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('/home/shubham_singh/Documents/NeoMentor/html/dashboard.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously" });

setTimeout(() => {
    try {
        const doc = dom.window.document;
        const calendarLink = doc.querySelector('.sidebar-nav a[data-page="calendar"]');
        if (calendarLink) {
            console.log('Found calendar link. Clicking...');
            calendarLink.click();
            console.log('Click executed.');
            const calendarPage = doc.getElementById('page-calendar');
            console.log('Is calendar active?', calendarPage.classList.contains('active'));
        } else {
            console.log('Calendar link not found');
        }
    } catch (e) {
        console.error('Error during click:', e);
    }
}, 500);

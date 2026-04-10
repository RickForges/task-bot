const { chromium } = require('playwright');
const axios = require('axios');

const TOKEN = "8618375775:AAEcUFUiENgLn7Eskg_E_lCQSVf11AVXuz0";
const CHAT_ID = "1749975064";

const URL = "https://taskflux.net/dashboard";

let lastSummary = "";

async function checkTasks() {
  try {
    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
      storageState: 'auth.json'
    });

    const page = await context.newPage();

    await page.goto(URL, { timeout: 60000 });
    await page.waitForTimeout(3000); // allow UI to load

    // 🔹 ONLY category buttons (no dashboard junk)
    const categories = await page.$$eval('#type button', btns =>
      btns.map(b => b.innerText.trim())
    );

    let summary = "";

    for (const item of categories) {
      const match = item.match(/\((\d+)\)/);
      const count = match ? parseInt(match[1]) : 0;

      if (count > 0) {
        summary += `• ${item}\n`;
      }
    }

    // 🔹 send only if changed
    if (summary && summary !== lastSummary) {
      lastSummary = summary;

      const message = `🚨 TASK UPDATE\n\n${summary}`;

      await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        chat_id: CHAT_ID,
        text: message
      });

      console.log("Updated:\n", summary);
    } else {
      console.log("No change");
    }

    await browser.close();

  } catch (err) {
    console.log("Error:", err.message);
  }
}

// 🔁 run every 2 minutes
setInterval(checkTasks, 30000);

// ▶️ run once immediately
checkTasks();
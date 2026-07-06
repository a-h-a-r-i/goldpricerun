const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error(
    "Missing environment variables. Set BOT_TOKEN and CHAT_ID before running."
  );
  process.exit(1);
}

const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

async function sendUpdate() {
  try {
    const response = await axios.get(
      "https://statewisebcast.dpgold.in:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/dpgold"
    );

    const raw = response.data;
    const lines = raw.split("\n");

    let gold = 0;
    let silver = 0;

    for (const line of lines) {
      if (line.includes("GOLD IMPORTED 999")) {
        const parts = line.split("\t");
        gold = parseFloat(parts[3]);
      }

      if (line.includes("SILVER 30 KG PAN India")) {
        const parts = line.split("\t");
        silver = parseFloat(parts[3]);
      }
    }

    const ratio = ((gold / silver) * 1000).toFixed(2);

    const time = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const text = `📊 DP GOLD LIVE RATES

🥇 Gold (AP & TS): ₹${gold} /10g
🥈 Silver (30 KG): ₹${silver}

📈 Gold/Silver Ratio: ${ratio}

⏰ Updated: ${time}`;

    await axios.post(telegramUrl, {
      chat_id: CHAT_ID,
      text,
    });

    console.log("✅ Telegram message sent successfully.");
  } catch (err) {
    console.error("❌ Send failed:", err.response?.data || err.message);
    process.exit(1);
  }
}

async function main() {
  console.log("🚀 DP GOLD TELEGRAM BOT started.");
  await sendUpdate();
}

main();

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
    });

    const text = `📊 DP GOLD LIVE RATES\n\n🥇 Gold (AP & TS): ₹${gold} /10g\n🥈 Silver (30 KG): ₹${silver}\n\n📈 Gold/Silver Ratio: ${ratio}\n\n⏰ Updated: ${time}`;

    await axios.post(telegramUrl, {
      chat_id: CHAT_ID,
      text,
    });

    console.log(`${new Date().toLocaleString()} - Telegram message sent.`);
  } catch (err) {
    console.error("Send failed:", err.message || err);
  }
}

function getNextRunTime() {
  const now = new Date();
  const zones = [10, 17];
  const candidates = zones
    .map((hour) => {
      const next = new Date(now);
      next.setHours(hour, 0, 0, 0);
      return next;
    })
    .filter((time) => time > now);

  if (candidates.length) {
    return candidates[0];
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  tomorrow.setMilliseconds(0);
  return tomorrow;
}

function scheduleNext() {
  const nextRun = getNextRunTime();
  const delay = nextRun.getTime() - Date.now();

  console.log(
    `Next update scheduled for ${nextRun.toLocaleString()} (in ${Math.round(
      delay / 60000
    )} minutes).`
  );

  setTimeout(async () => {
    await sendUpdate();
    scheduleNext();
  }, delay);
}

async function main() {
  const runOnce = process.env.RUN_ONCE === "true" || process.env.RUN_ONCE === "1";

  console.log("DP GOLD TELEGRAM BOT started.");

  if (runOnce) {
    await sendUpdate();
    return;
  }

  scheduleNext();
}

main();

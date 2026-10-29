import dotenv from 'dotenv';
dotenv.config();

/**
 * CLI utility to test your Telegram Bot and send messages directly.
 *
 * Usage:
 *   npx tsx scripts/sendTelegramMessage.ts <chat_id> "Your message here"
 *
 * If run without arguments:
 *   npx tsx scripts/sendTelegramMessage.ts
 *   -> Tests the bot token and displays recent chat IDs who started the bot.
 */

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const username = process.env.TELEGRAM_BOT_USERNAME;

  console.log('==============================================');
  console.log('MediTrack Telegram Bot Messenger Utility');
  console.log('==============================================\n');

  if (!token || token.trim() === '') {
    console.error('❌ ERROR: TELEGRAM_BOT_TOKEN is empty in your .env file.');
    console.log('\nTo create your bot in 1 minute:');
    console.log('1. Open Telegram and search for @BotFather');
    console.log('2. Send: /newbot');
    console.log('3. Name it (e.g. MediTrack Alerts)');
    console.log('4. Choose a username ending in bot (e.g. MyMediTrackAlertsBot)');
    console.log('5. Copy the HTTP API token into .env as TELEGRAM_BOT_TOKEN="your-token"');
    console.log('6. Set TELEGRAM_BOT_USERNAME="MyMediTrackAlertsBot"');
    process.exit(1);
  }

  // 1. Verify Bot Token with getMe
  console.log('1. Checking Bot Token with Telegram API...');
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData: any = await meRes.json();

    if (!meRes.ok || !meData.ok) {
      console.error('❌ Telegram Bot API Error:', meData.description || 'Invalid token');
      process.exit(1);
    }

    const bot = meData.result;
    console.log(`✅ Bot Connected Successfully!`);
    console.log(`   - Name: ${bot.first_name}`);
    console.log(`   - Username: @${bot.username}`);
    console.log(`   - Bot ID: ${bot.id}`);
    console.log(`   - Can Join Groups: ${bot.can_join_groups}`);
  } catch (err: any) {
    console.error('❌ Network error connecting to api.telegram.org:', err.message);
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const targetChatId = args[0];
  const customMessage = args.slice(1).join(' ');

  if (!targetChatId) {
    console.log('\n2. Fetching recent chats / updates...');
    try {
      const updatesRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
      const updatesData: any = await updatesRes.json();

      if (updatesData.ok && updatesData.result?.length > 0) {
        console.log('\nFound users who recently started the bot:');
        const seenChats = new Set<string>();
        for (const u of updatesData.result) {
          const chat = u.message?.chat || u.edited_message?.chat;
          if (chat && !seenChats.has(String(chat.id))) {
            seenChats.add(String(chat.id));
            console.log(`   • Chat ID: ${chat.id} (${chat.first_name || ''} ${chat.last_name || ''} @${chat.username || 'no_username'})`);
          }
        }
        console.log('\nTo send a message to one of these chats, run:');
        console.log(`   npx tsx scripts/sendTelegramMessage.ts <chat_id> "Hello from MediTrack!"`);
      } else {
        console.log('\nℹ️ No recent messages found.');
        console.log('Open your bot in Telegram and tap START:');
        console.log(`   https://t.me/${username || 'your_bot_username'}`);
        console.log('Then re-run this script to see your Chat ID.');
      }
    } catch (e: any) {
      console.log('Could not fetch updates:', e.message);
    }
    return;
  }

  // 2. Send Message to Chat ID
  const messageToSend =
    customMessage ||
    `🚨 <b>MEDITRACK HEALTH ALERT NOTIFICATION</b>\n\n` +
    `Hello! This is a verified test alert sent directly from your <b>MediTrack Medical Monitoring Bot</b>.\n\n` +
    `Timestamp: <code>${new Date().toLocaleString()}</code>\n` +
    `Status: <b>Verified & Operational</b>\n\n` +
    `<i>MediTrack Clinical Intelligence Network</i>`;

  console.log(`\n2. Sending message to Chat ID: ${targetChatId}...`);

  try {
    const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: messageToSend,
        parse_mode: 'HTML'
      })
    });

    const sendData: any = await sendRes.json();

    if (!sendRes.ok || !sendData.ok) {
      console.error('\n❌ Telegram Delivery Failed:');
      console.error(`   Error Code: ${sendData.error_code}`);
      console.error(`   Description: ${sendData.description}`);
      if (sendData.error_code === 403) {
        console.log('\n💡 Hint: The user has not started the bot or blocked it. The user must open the bot and tap START first.');
      }
      process.exit(1);
    }

    console.log('\n🎉 SUCCESS! Message delivered.');
    console.log(`   - Message ID: ${sendData.result.message_id}`);
    console.log(`   - Date: ${new Date(sendData.result.date * 1000).toLocaleString()}`);
    console.log(`   - Chat Recipient: ${sendData.result.chat.first_name || sendData.result.chat.username || targetChatId}`);
  } catch (err: any) {
    console.error('❌ Failed to send message:', err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

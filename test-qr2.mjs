import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const context = await browser.newContext();
const page = await context.newPage();

console.log('=== Testing Identity & Baggages QR Flow ===\n');

try {
  // Try the eth0 IP
  console.log('1. Navigating to /agence/connexion...');
  await page.goto('http://21.0.3.123:3000/agence/connexion', { waitUntil: 'networkidle', timeout: 30000 });
  console.log(`   Current URL: ${page.url()}`);
  console.log(`   Page title: ${await page.title()}`);
} catch (e) {
  console.log(`   Error with 21.0.3.123: ${e.message.split('\n')[0]}`);
  // Try localhost
  try {
    await page.goto('http://localhost:3000/agence/connexion', { waitUntil: 'networkidle', timeout: 15000 });
    console.log(`   Connected via localhost! URL: ${page.url()}`);
  } catch (e2) {
    console.log(`   Error with localhost: ${e2.message.split('\n')[0]}`);
    // Try 127.0.0.1
    try {
      await page.goto('http://127.0.0.1:3000/agence/connexion', { waitUntil: 'networkidle', timeout: 15000 });
      console.log(`   Connected via 127.0.0.1! URL: ${page.url()}`);
    } catch (e3) {
      console.log(`   Error with 127.0.0.1: ${e3.message.split('\n')[0]}`);
      await browser.close();
      process.exit(1);
    }
  }
}

await browser.close();

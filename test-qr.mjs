import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

console.log('=== Testing Identity & Baggages QR Flow ===\n');

// Test 1: Navigate to connexion page
console.log('1. Navigating to /agence/connexion...');
await page.goto('http://localhost:3000/agence/connexion', { waitUntil: 'networkidle', timeout: 30000 });
console.log(`   Current URL: ${page.url()}`);
console.log(`   Page title: ${await page.title()}`);

// Take a screenshot
await page.screenshot({ path: '/tmp/connexion-page.png', fullPage: true });
console.log('   Screenshot saved: /tmp/connexion-page.png');

// Check if there's a login form
const loginForm = await page.locator('form').count();
console.log(`   Forms found: ${loginForm}`);

// Let's try to find input fields
const inputs = await page.locator('input').all();
for (const input of inputs) {
  const type = await input.getAttribute('type');
  const placeholder = await input.getAttribute('placeholder');
  const name = await input.getAttribute('name');
  console.log(`   Input: type=${type}, name=${name}, placeholder=${placeholder}`);
}

// Try to login if form exists
const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail"]').first();
const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="pass"]').first();

if (await emailInput.count() > 0) {
  console.log('\n2. Attempting login...');
  await emailInput.fill('agency@test.com');
  await passwordInput.fill('password123');
  
  // Find submit button
  const submitBtn = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Login"), button:has-text("Se connecter")').first();
  if (await submitBtn.count() > 0) {
    await submitBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    console.log(`   After login URL: ${page.url()}`);
    await page.screenshot({ path: '/tmp/after-login.png', fullPage: true });
  }
}

// Test 2: Navigate to identity page
console.log('\n3. Navigating to /agence/identity...');
await page.goto('http://localhost:3000/agence/identity', { waitUntil: 'networkidle', timeout: 30000 }).catch(async () => {
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
});
console.log(`   Current URL: ${page.url()}`);
await page.screenshot({ path: '/tmp/identity-page.png', fullPage: true });
console.log('   Screenshot saved: /tmp/identity-page.png');

// Check for QR code links in the identity page
const qrLinks = await page.locator('a[href*="/found/"]').all();
console.log(`   QR code links found: ${qrLinks.length}`);
for (let i = 0; i < Math.min(qrLinks.length, 5); i++) {
  const href = await qrLinks[i].getAttribute('href');
  const text = await qrLinks[i].textContent();
  console.log(`   Link ${i+1}: href="${href}", text="${text?.trim()}"`);
}

// Check for tables with QR data
const tableRows = await page.locator('table tbody tr').count();
console.log(`   Table rows: ${tableRows}`);

// Check for group-hover classes (hover effects) in the rendered HTML
const pageContent = await page.content();
const hasGroupHover = pageContent.includes('group-hover') || pageContent.includes('group/qr');
console.log(`   Has group/qr hover classes in HTML: ${hasGroupHover}`);

// Check the actual rendered link styling
if (qrLinks.length > 0) {
  const firstLink = qrLinks[0];
  const linkBox = await firstLink.boundingBox();
  console.log(`   First link bounding box: ${JSON.stringify(linkBox)}`);
  
  // Try hovering and checking style changes
  await firstLink.hover();
  await page.waitForTimeout(500);
  const spanInside = firstLink.locator('span').first();
  if (await spanInside.count() > 0) {
    const color = await spanInside.evaluate(el => window.getComputedStyle(el).color);
    console.log(`   Span color on hover: ${color}`);
  }
}

// Test 3: Navigate to baggages page
console.log('\n4. Navigating to /agence/baggages...');
await page.goto('http://localhost:3000/agence/baggages', { waitUntil: 'networkidle', timeout: 30000 }).catch(async () => {
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
});
console.log(`   Current URL: ${page.url()}`);
await page.screenshot({ path: '/tmp/baggages-page.png', fullPage: true });
console.log('   Screenshot saved: /tmp/baggages-page.png');

// Check for QR code links in the baggages page
const qrLinks2 = await page.locator('a[href*="/found/"]').all();
console.log(`   QR code links found: ${qrLinks2.length}`);
for (let i = 0; i < Math.min(qrLinks2.length, 5); i++) {
  const href = await qrLinks2[i].getAttribute('href');
  const text = await qrLinks2[i].textContent();
  console.log(`   Link ${i+1}: href="${href}", text="${text?.trim()}"`);
}

// Check for tables
const tableRows2 = await page.locator('table tbody tr').count();
console.log(`   Table rows: ${tableRows2}`);

// Check hover styling for baggages
if (qrLinks2.length > 0) {
  const firstLink2 = qrLinks2[0];
  await firstLink2.hover();
  await page.waitForTimeout(500);
  const spanInside2 = firstLink2.locator('span').first();
  if (await spanInside2.count() > 0) {
    const color2 = await spanInside2.evaluate(el => window.getComputedStyle(el).color);
    console.log(`   Span color on hover: ${color2}`);
  }
}

// Test clicking a QR link
if (qrLinks.length > 0) {
  console.log('\n5. Testing QR link click on identity page...');
  await page.goto('http://localhost:3000/agence/identity', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  const testLink = page.locator('a[href*="/found/"]').first();
  if (await testLink.count() > 0) {
    const href = await testLink.getAttribute('href');
    console.log(`   Clicking link with href: ${href}`);
    await testLink.click();
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    console.log(`   After click URL: ${page.url()}`);
    await page.screenshot({ path: '/tmp/after-qr-click.png', fullPage: true });
  }
}

await browser.close();
console.log('\n=== Test Complete ===');

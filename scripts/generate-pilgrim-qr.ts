/**
 * Generate Pilgrim QR codes for Pass Identity
 * 
 * Usage:
 *   bun run scripts/generate-pilgrim-qr.ts --count 10
 *   bun run scripts/generate-pilgrim-qr.ts --count 5 --output qr-codes.json
 * 
 * Generates QR codes in format PH-P-XXXXX
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

// Character set (no confusing chars: I, O, 0, 1)
const QR_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generatePilgrimCode(length: number = 5): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += QR_CHARS.charAt(Math.floor(Math.random() * QR_CHARS.length));
  }
  return result;
}

async function main() {
  // Parse args
  const args = process.argv.slice(2);
  let count = 1;
  let outputFile: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      count = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputFile = args[i + 1];
      i++;
    } else if (args[i] === '--help') {
      console.log(`
Usage: bun run scripts/generate-pilgrim-qr.ts [options]

Options:
  --count N    Number of QR codes to generate (default: 1, max: 100)
  --output F   Output file path (JSON format)
  --help       Show this help

Example:
  bun run scripts/generate-pilgrim-qr.ts --count 10
  bun run scripts/generate-pilgrim-qr.ts --count 5 --output pilgrim-qr.json
      `);
      return;
    }
  }

  count = Math.min(Math.max(count, 1), 100);

  console.log(`\n🕋 Pass Identity — QR Code Generator`);
  console.log(`   Generating ${count} QR code(s)...\n`);

  // Use the API to generate QR codes
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/pilgrims/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json() as { success: boolean; generated: number; qrCodes: string[] };

    console.log(`✅ Generated ${data.generated} QR code(s):\n`);
    
    for (const code of data.qrCodes) {
      const scanUrl = `${baseUrl}/p/${code}`;
      const activateUrl = `${baseUrl}/pilgrim/activate/${code}`;
      const dashboardUrl = `${baseUrl}/pilgrim/dashboard/${code}`;
      
      console.log(`  🏷️  ${code}`);
      console.log(`     Scan:      ${scanUrl}`);
      console.log(`     Activate:  ${activateUrl}`);
      console.log(`     Dashboard: ${dashboardUrl}`);
      console.log('');
    }

    if (outputFile) {
      const output = {
        generated: data.generated,
        qrCodes: data.qrCodes.map((code: string) => ({
          code,
          scanUrl: `${baseUrl}/p/${code}`,
          activateUrl: `${baseUrl}/pilgrim/activate/${code}`,
          dashboardUrl: `${baseUrl}/pilgrim/dashboard/${code}`,
        })),
        createdAt: new Date().toISOString(),
      };
      
      writeFileSync(outputFile, JSON.stringify(output, null, 2));
      console.log(`📄 Output saved to: ${outputFile}`);
    }

    console.log(`\n💡 Next steps:`);
    console.log(`   1. Print QR codes pointing to: ${baseUrl}/p/{CODE}`);
    console.log(`   2. Share activation links with pilgrims`);
    console.log(`   3. Pilgrims activate their bracelet at: ${baseUrl}/pilgrim/activate/{CODE}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error generating QR codes:', error);
    console.error('   Make sure the dev server is running: bun run dev');
    process.exit(1);
  }
}

main();

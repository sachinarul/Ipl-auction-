import * as fs from 'fs';
import * as path from 'path';

interface Player {
  id: number;
  name: string;
  country: string;
  age: number;
  role: string;
  category: string;
  basePrice: number;
  overallRating: number;
  marketValueScore: number;
}

function verifyDatabase() {
  const dataPath = path.join(process.cwd(), './src/lib/players-data.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`Error: player database JSON not found at ${dataPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const players: Player[] = JSON.parse(rawData);

  const totalPlayers = players.length;
  
  // Base Price Distribution
  const basePrices: Record<string, number> = {};
  // Rating Distribution
  const ratingTiers = {
    'Marquee (90-99)': 0,
    'Established (80-89)': 0,
    'Good Domestic (70-79)': 0,
    'Emerging (60-69)': 0,
    'Young Prospects (50-59)': 0,
    'Under 50 (N/A)': 0
  };

  let marqueeCount = 0;
  let emergingCount = 0;
  let overseasCount = 0;
  let indianCount = 0;

  players.forEach((p) => {
    // Country origin
    if (p.country === 'India') {
      indianCount++;
    } else {
      overseasCount++;
    }

    // Category check
    if (p.category === 'Marquee Players') {
      marqueeCount++;
    } else if (p.category === 'Emerging Players') {
      emergingCount++;
    }

    // Base price distribution
    const priceKey = `₹${p.basePrice < 1 ? (p.basePrice * 100) + ' Lakh' : p.basePrice + ' Crore'}`;
    basePrices[priceKey] = (basePrices[priceKey] || 0) + 1;

    // Rating tiers distribution
    const ovr = p.overallRating;
    if (ovr >= 90) ratingTiers['Marquee (90-99)']++;
    else if (ovr >= 80) ratingTiers['Established (80-89)']++;
    else if (ovr >= 70) ratingTiers['Good Domestic (70-79)']++;
    else if (ovr >= 60) ratingTiers['Emerging (60-69)']++;
    else if (ovr >= 50) ratingTiers['Young Prospects (50-59)']++;
    else ratingTiers['Under 50 (N/A)']++;
  });

  console.log('==================================================');
  console.log('       IPL 2025 PLAYER DATABASE VERIFICATION      ');
  console.log('==================================================');
  console.log(`Total Players Generated:       ${totalPlayers}`);
  console.log(`Indian Players Count:          ${indianCount}`);
  console.log(`Overseas Players Count:        ${overseasCount}`);
  console.log(`Marquee Players Count:         ${marqueeCount}`);
  console.log(`Emerging Players Count:        ${emergingCount}`);
  console.log('\n--------------------------------------------------');
  console.log('            BASE PRICE DISTRIBUTION               ');
  console.log('--------------------------------------------------');
  Object.keys(basePrices)
    .sort((a, b) => {
      // Sort from highest price to lowest
      const parseVal = (str: string) => {
        if (str.includes('Crore')) return parseFloat(str.replace(/[^0-9.]/g, '')) * 100;
        return parseFloat(str.replace(/[^0-9.]/g, ''));
      };
      return parseVal(b) - parseVal(a);
    })
    .forEach((key) => {
      console.log(` ${key.padEnd(20)}: ${basePrices[key]} players`);
    });

  console.log('\n--------------------------------------------------');
  console.log('            RATING TIER DISTRIBUTION              ');
  console.log('--------------------------------------------------');
  Object.keys(ratingTiers).forEach((tier) => {
    console.log(` ${(tier).padEnd(25)}: ${(ratingTiers as any)[tier]} players`);
  });
  console.log('==================================================');
}

verifyDatabase();

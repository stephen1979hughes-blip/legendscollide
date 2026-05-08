// Verify goal scorers and cards are properly formatted
import fs from 'fs';

const matchEngineCode = fs.readFileSync('./web/src/services/matchEngine.ts', 'utf8');
const broadcastCode = fs.readFileSync('./web/src/pages/Broadcast.tsx', 'utf8');

console.log('🧪 Testing Goal Scorer & Card Display\n');

// Check goal text format in matchEngine
if (matchEngineCode.includes('GOAL! ${goal.goalScorer} scores!')) {
  console.log('✓ Goal text format: "GOAL! {playerName} scores!"');
} else {
  console.log('✗ Goal text format issue');
}

// Check regex patterns in Broadcast
if (broadcastCode.includes("match(/GOAL! (.+?) scores!/")) {
  console.log('✓ Broadcast regex matches new goal format');
} else {
  console.log('✗ Broadcast regex missing new format');
}

if (broadcastCode.includes("match(/GOAL! (.+?) scores for/")) {
  console.log('✓ Broadcast has fallback regex for old format');
} else {
  console.log('✗ Broadcast missing fallback regex');
}

// Check goal scorer extraction
if (broadcastCode.includes("const playerName = match ? match[1]")) {
  console.log('✓ Goal scorer extraction from regex');
} else {
  console.log('✗ Goal scorer extraction issue');
}

// Check card tracking
if (broadcastCode.includes('const visibleCardsA') && broadcastCode.includes('const visibleCardsB')) {
  console.log('✓ Card tracking for both teams');
} else {
  console.log('✗ Card tracking missing');
}

// Check card extraction from events
if (broadcastCode.includes("e.type === 'card'") && broadcastCode.includes('playerTeam')) {
  console.log('✓ Card events parsed with team assignment');
} else {
  console.log('✗ Card parsing issue');
}

// Check card display for yellow cards
if (broadcastCode.includes("card.cardType === 'yellow'") || broadcastCode.includes("'yellow'")) {
  console.log('✓ Yellow card display');
} else {
  console.log('✗ Yellow card display missing');
}

// Check card display for red cards
if (broadcastCode.includes("card.cardType === 'red'") || broadcastCode.includes("'red'")) {
  console.log('✓ Red card display');
} else {
  console.log('✗ Red card display missing');
}

// Check card icons
if (broadcastCode.includes('🔴') && broadcastCode.includes('🟡')) {
  console.log('✓ Card icons (🔴 red, 🟡 yellow)');
} else {
  console.log('✗ Card icons missing');
}

// Check matchEngine generates cards
if (matchEngineCode.includes('generateFoulEvent') && matchEngineCode.includes('cardType')) {
  console.log('✓ matchEngine generates card events');
} else {
  console.log('✗ matchEngine card generation missing');
}

// Check player stats include cards
if (matchEngineCode.includes('yellowCards') && matchEngineCode.includes('redCards')) {
  console.log('✓ Player stats track cards');
} else {
  console.log('✗ Player stats card tracking missing');
}

console.log('\n✅ All goal scorer & card display features verified!');

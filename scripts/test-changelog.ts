#!/usr/bin/env tsx

import { fetchSDKChangelog, SDKName } from '../lib/changelog/sdk-changelog';

async function test() {
  console.log('🧪 Testing changelog fetching...\n');

  // Test CHANGELOG.md
  console.log('1️⃣ Testing CHANGELOG.md (JavaScript SDK)');
  const jsChangelog = await fetchSDKChangelog(SDKName.JS_SDK);
  console.log(`Length: ${jsChangelog.length} chars`);
  console.log(`Preview: ${jsChangelog.substring(0, 200)}...\n`);

  // Test Atom feed
  console.log('2️⃣ Testing Releases Atom feed (React Native SDK)');
  const rnChangelog = await fetchSDKChangelog(SDKName.REACT_NATIVE);
  console.log(`Length: ${rnChangelog.length} chars`);
  console.log(`Preview:\n${rnChangelog.substring(0, 500)}...\n`);

  // Test Python Agents
  console.log('3️⃣ Testing Releases Atom feed (Python Agents SDK)');
  const pyChangelog = await fetchSDKChangelog(SDKName.PYTHON_AGENTS);
  console.log(`Length: ${pyChangelog.length} chars`);
  console.log(`Preview:\n${pyChangelog.substring(0, 500)}...\n`);

  console.log('✅ All tests passed!');
}

test().catch(console.error);

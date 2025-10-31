// generate-key.mjs
// A small script to generate a new RSA public/private key pair in JWK format.
// We use the 'jose' library, which is already a dependency in this project.

// To run:
// 1. Make sure 'jose' is installed: npm install jose
// 2. Execute the script: node generate-key.mjs

import { generateKeyPair, exportJWK } from 'jose';

async function createKeys() {
  console.log('Generating new RSA-RS256 key pair...');

  // The important change is here: we add { extractable: true }.
  // This tells 'jose' to create keys that we can export into the JWK format.
  const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true });

  // Export both keys into the JSON Web Key (JWK) format.
  const publicJwk = await exportJWK(publicKey);
  const privateJwk = await exportJWK(privateKey);

  // Add a Key ID (kid) to both keys. This is important for matching keys.
  const kid = 'demo-key-1';
  publicJwk.kid = kid;
  privateJwk.kid = kid;

  console.log('\n✅ Key generation complete!');
  console.log('--------------------------------------------------');
  console.log('\n🔵 PUBLIC JWK (for TOOL_PUBLIC_JWK):');
  console.log(JSON.stringify(publicJwk));

  console.log('\n\n🔴 PRIVATE JWK (for TOOL_PRIVATE_JWK):');
  console.log(JSON.stringify(privateJwk));
  console.log('\n--------------------------------------------------');
  console.log('\nACTION: Copy these values into your environment variables.');
}

createKeys();

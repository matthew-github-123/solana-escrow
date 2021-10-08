import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
} from "@solana/web3.js";

import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  getKeypair,
  getPublicKey,
  getTokenBalance,
  writePublicKey,
} from "./utils";

import * as fs from "fs";

const createMint = (
  connection: Connection,
  { publicKey, secretKey }: Signer
) => {
  return Token.createMint(
    connection,
    {
      publicKey,
      secretKey,
    },
    publicKey,
    null,
    0,
    TOKEN_PROGRAM_ID
  );
};

const setupMint = async (
  name: string,
  connection: Connection,
  alicePublicKey: PublicKey,
  bobPublicKey: PublicKey,
  adamPublicKey: PublicKey,
  clientKeypair: Signer
): Promise<[Token, PublicKey, PublicKey, PublicKey]> => {
//  console.log(`Creating Mint ${name}...`);
  const mint = await createMint(connection, clientKeypair);
  writePublicKey(mint.publicKey, `mint_${name.toLowerCase()}`);
  console.log("clientKeypair ...");
  console.log(clientKeypair);
  console.log("clientKeypair public key ...");
  console.log(clientKeypair.publicKey);
  console.log("mint public key ...");
  console.log(mint.publicKey);
  console.log("mint object");
  console.log(mint);

//  console.log(`Creating Alice TokenAccount for ${name}...`);
  const aliceTokenAccount = await mint.createAccount(alicePublicKey);
  writePublicKey(aliceTokenAccount, `alice_${name.toLowerCase()}`);

//  console.log(`Creating Bob TokenAccount for ${name}...`);
  const bobTokenAccount = await mint.createAccount(bobPublicKey);
  writePublicKey(bobTokenAccount, `bob_${name.toLowerCase()}`);

//  console.log(`Creating Adam TokenAccount for ${name}...`);
  const adamTokenAccount = await mint.createAccount(adamPublicKey);
  writePublicKey(adamTokenAccount, `adam_${name.toLowerCase()}`);

  return [mint, aliceTokenAccount, bobTokenAccount, adamTokenAccount];
};

const setup = async () => {
//  console.log("-----setup.ts-----");
  const alicePublicKey = getPublicKey("alice");
  const bobPublicKey = getPublicKey("bob");
  const adamPublicKey = getPublicKey("adam");
  const clientKeypair = getKeypair("id");

  console.log(alicePublicKey);
  const aliceString = JSON.stringify(alicePublicKey);
  console.log(aliceString);
  console.log(JSON.parse(aliceString as string));

  console.log("--to bytes--");
  console.log(alicePublicKey.toBytes());

  console.log(bobPublicKey);
  console.log("-------------");
  //buffer
  const testkey0 = fs.readFileSync(`./keys/alice_pub.json`) as unknown as string;
  console.log(testkey0);
  console.log(testkey0.constructor.name);
  //console.log(testkey0 instanceof ArrayBuffer);
  const testkey05 = fs.readFileSync(`./keys/alice_pub.json`);
  console.log(testkey05);
  const testkey = JSON.parse(fs.readFileSync(`./keys/alice_pub.json`) as unknown as string);
  console.log(testkey);
  console.log("type of testkey ...");
  console.log(typeof testkey);
  const testkey2 = JSON.parse(fs.readFileSync(`./keys/bob_pub.json`) as unknown as string);
  console.log(testkey2);
  const testkey3 = JSON.parse(fs.readFileSync(`./keys/adam_pub.json`) as unknown as string);
  console.log(testkey3);
  console.log("-------------");
  console.log("keypair values");
  console.log("keypair.publicKey");
  console.log("keypair.secretKey");

  console.log(typeof alicePublicKey);
  console.log(typeof bobPublicKey);
  console.log(typeof adamPublicKey);
  console.log(typeof clientKeypair);

  console.log(alicePublicKey);

  console.log(JSON.stringify(alicePublicKey));
  console.log(JSON.stringify(bobPublicKey));
  console.log(JSON.stringify(adamPublicKey));
  console.log(JSON.stringify(clientKeypair));

  async function establishTestnetConnection(){
			const rpcUrl = "https://api.testnet.solana.com";
			const connection = new Connection(rpcUrl, 'confirmed');
			const version = await connection.getVersion();
			console.log('Testnet Connection to cluster established:', rpcUrl, version);
}

async function establishLocalConnection(){
    const rpcUrl = "http://localhost:8899";
    const connection = new Connection(rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    console.log('Local Connection to cluster established:', rpcUrl, version);
}

establishTestnetConnection();
establishLocalConnection();

//await establishConnection() => {
//      return newConnection;
//};

    //const connection = new Connection("https://api.testnet.solana.com", "confirmed");
 const connection = new Connection("http://localhost:8899", "confirmed");
//  console.log("Requesting SOL for Alice...");
  // some networks like the local network provide an airdrop function (mainnet of course does not)
  await newConnection.requestAirdrop(alicePublicKey, LAMPORTS_PER_SOL * 10);

  await connection.requestAirdrop(alicePublicKey, LAMPORTS_PER_SOL * 10);
//  console.log("Requesting SOL for Bob...");
  await connection.requestAirdrop(bobPublicKey, LAMPORTS_PER_SOL * 10);
//  console.log("Requesting SOL for Adam...");
  await connection.requestAirdrop(adamPublicKey, LAMPORTS_PER_SOL * 10);

  console.log("Mint Testing------");

  //const testmint = async (
  //connection: Connection,
  //clientKeypair: Signer
  //) => {
  //return ( await Promise.all( [
  const mintTest = await Token.createMint(connection, clientKeypair, clientKeypair.publicKey, null, 0, TOKEN_PROGRAM_ID);
  console.log("----------------------");
  console.log("----------------------");
  console.log(mintTest.publicKey);
  console.log(mintTest);
  console.log("----------------------");
  console.log("----------------------");
//]);
//);
//};

  //console.log(testmint.mintTest);

  const [mintX, aliceTokenAccountForX, bobTokenAccountForX, adamTokenAccountForX] = await setupMint(
    "X",
    connection,
    alicePublicKey,
    bobPublicKey,
    adamPublicKey,
    clientKeypair
  );
//  console.log("Sending 50X to Alice's X TokenAccount...");
  await mintX.mintTo(aliceTokenAccountForX, clientKeypair.publicKey, [], 50);
  await mintX.mintTo(bobTokenAccountForX, clientKeypair.publicKey, [], 10);
  await mintX.mintTo(adamTokenAccountForX, clientKeypair.publicKey, [], 40);

  //const [mintY, aliceTokenAccountForY, bobTokenAccountForY] = await setupMint(
  //  "Y",
  //  connection,
  //  alicePublicKey,
  //  bobPublicKey,
  //  clientKeypair
  //);
  //console.log("Sending 50Y to Bob's Y TokenAccount...");
  //await mintY.mintTo(bobTokenAccountForY, clientKeypair.publicKey, [], 50);

//  console.log("✨Setup complete✨\n");
console.log("Alice opening account");
  console.table([
   {
      "Alice Token Account X": await getTokenBalance(
       aliceTokenAccountForX,
        connection
      ),


      //"Alice Token Account Y": await getTokenBalance(
      //  aliceTokenAccountForY,
      //  connection
      //),
  //    "Contract": 0,
    //  "Bob Token Account X": await getTokenBalance(
    //    bobTokenAccountForX,
    //    connection
    //  ),
      //"Bob Token Account Y": await getTokenBalance(
      //  bobTokenAccountForY,
      //  connection
      //),
    },
  ]);
  console.log("Adam opening account");
  console.table([
    {
      "Adam Token Account X": await getTokenBalance(
        adamTokenAccountForX,
        connection
      ),
  //    "Contract": 0,
   },
  ]);
//  console.log("");
};

setup();

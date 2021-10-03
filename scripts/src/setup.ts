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
  console.log(`Creating Mint ${name}...`);
  const mint = await createMint(connection, clientKeypair);
  writePublicKey(mint.publicKey, `mint_${name.toLowerCase()}`);

  console.log(`Creating Alice TokenAccount for ${name}...`);
  const aliceTokenAccount = await mint.createAccount(alicePublicKey);
  writePublicKey(aliceTokenAccount, `alice_${name.toLowerCase()}`);

  console.log(`Creating Bob TokenAccount for ${name}...`);
  const bobTokenAccount = await mint.createAccount(bobPublicKey);
  writePublicKey(bobTokenAccount, `bob_${name.toLowerCase()}`);

  console.log(`Creating Adam TokenAccount for ${name}...`);
  const adamTokenAccount = await mint.createAccount(adamPublicKey);
  writePublicKey(adamTokenAccount, `adam_${name.toLowerCase()}`);

  return [mint, aliceTokenAccount, bobTokenAccount, adamTokenAccount];
};

const setup = async () => {
  const alicePublicKey = getPublicKey("alice");
  const bobPublicKey = getPublicKey("bob");
  const adamPublicKey = getPublicKey("adam");
  const clientKeypair = getKeypair("id");

  const connection = new Connection("http://localhost:8899", "confirmed");
  console.log("Requesting SOL for Alice...");
  // some networks like the local network provide an airdrop function (mainnet of course does not)
  await connection.requestAirdrop(alicePublicKey, LAMPORTS_PER_SOL * 10);
  console.log("Requesting SOL for Bob...");
  await connection.requestAirdrop(bobPublicKey, LAMPORTS_PER_SOL * 10);
  console.log("Requesting SOL for Adam...");
  await connection.requestAirdrop(adamPublicKey, LAMPORTS_PER_SOL * 10);

  const [mintX, aliceTokenAccountForX, bobTokenAccountForX, adamTokenAccountForX] = await setupMint(
    "X",
    connection,
    alicePublicKey,
    bobPublicKey,
    adamPublicKey,
    clientKeypair
  );
  console.log("Sending 50X to Alice's X TokenAccount...");
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

  console.log("✨Setup complete✨\n");
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
      "Contract": await getTokenBalance(
        tempXTokenAccountKeypair.publicKey,
        connection
      ),
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
  console.table([
    {
      "Adam Token Account X": await getTokenBalance(
        adamTokenAccountForX,
        connection
      ),
      "Contract": await getTokenBalance(
        tempadamXTokenAccountKeypair.publicKey,
        connection
      ),
    },
  ]);
  console.log("");
};

setup();

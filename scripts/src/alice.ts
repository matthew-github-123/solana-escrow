import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import BN = require("bn.js");
import {
  EscrowLayout,
  ESCROW_ACCOUNT_DATA_LAYOUT,
  getKeypair,
  getProgramId,
  getPublicKey,
  getTerms,
  getTokenBalance,
  logError,
  writePublicKey,
} from "./utils";

const alice = async () => {
  console.log("-----alice.ts-----");
  const escrowProgramId = getProgramId();
  const terms = getTerms();

  const aliceXTokenAccountPubkey = getPublicKey("alice_x");
  //const aliceYTokenAccountPubkey = getPublicKey("alice_y");
  const XTokenMintPubkey = getPublicKey("mint_x");
  const aliceKeypair = getKeypair("alice");

  const tempXTokenAccountKeypair = new Keypair();
  //const connection = new Connection("https://api.testnet.solana.com", "confirmed");
  const connection = new Connection("http://localhost:8899", "confirmed");
//  console.log("creating temp account ...");

console.log("creating token account ...");
console.log(aliceKeypair.publicKey);
console.log(tempXTokenAccountKeypair.publicKey);
console.log("**********");

  const createTempTokenAccountIx = SystemProgram.createAccount({
    programId: TOKEN_PROGRAM_ID,
    space: AccountLayout.span,
    lamports: await connection.getMinimumBalanceForRentExemption(
      AccountLayout.span
    ),
    fromPubkey: aliceKeypair.publicKey,
    newAccountPubkey: tempXTokenAccountKeypair.publicKey,
  });

console.log(createTempTokenAccountIx);

//  console.log("initialise temp account ...");
  const initTempAccountIx = Token.createInitAccountInstruction(
    TOKEN_PROGRAM_ID,
    XTokenMintPubkey,
    tempXTokenAccountKeypair.publicKey,
    aliceKeypair.publicKey
  );
//  console.log("transfer token x to temp account ...");
  const transferXTokensToTempAccIx = Token.createTransferInstruction(
    TOKEN_PROGRAM_ID,
    aliceXTokenAccountPubkey,
    tempXTokenAccountKeypair.publicKey,
    aliceKeypair.publicKey,
    [],
    terms.bobExpectedAmount
  );
  const escrowKeypair = new Keypair();
//  console.log("creating escrow account ...");
  const createEscrowAccountIx = SystemProgram.createAccount({
    space: ESCROW_ACCOUNT_DATA_LAYOUT.span,
    lamports: await connection.getMinimumBalanceForRentExemption(
      ESCROW_ACCOUNT_DATA_LAYOUT.span
    ),
    fromPubkey: aliceKeypair.publicKey,
    newAccountPubkey: escrowKeypair.publicKey,
    programId: escrowProgramId,
  });
  //console.log("initialising escrow account ...");
  const initEscrowIx = new TransactionInstruction({
    programId: escrowProgramId,
    keys: [
      { pubkey: aliceKeypair.publicKey, isSigner: true, isWritable: false },
      {
        pubkey: tempXTokenAccountKeypair.publicKey,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: aliceXTokenAccountPubkey,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: escrowKeypair.publicKey, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(
      Uint8Array.of(0, ...new BN(terms.aliceExpectedAmount).toArray("le", 8))
    ),
  });

  //console.log("creating the transaction ...");
  const tx = new Transaction().add(
    createTempTokenAccountIx,
    initTempAccountIx,
    transferXTokensToTempAccIx,
    createEscrowAccountIx,
    initEscrowIx
  );
  //console.log("Sending Alice's transaction...");
  await connection.sendTransaction(
    tx,
    [aliceKeypair, tempXTokenAccountKeypair, escrowKeypair],
    { skipPreflight: false, preflightCommitment: "confirmed" }
  );

  // sleep to allow time to update
  await new Promise((resolve) => setTimeout(resolve, 1000));

  //console.log("getting account info of escrow Account ...");
  const escrowAccount = await connection.getAccountInfo(
    escrowKeypair.publicKey
  );
  //console.log("getting escrow account info ...complete ...")

  if (escrowAccount === null || escrowAccount.data.length === 0) {
    logError("Escrow state account has not been initialized properly");
    process.exit(1);
  }

  const encodedEscrowState = escrowAccount.data;
  const decodedEscrowState = ESCROW_ACCOUNT_DATA_LAYOUT.decode(
    encodedEscrowState
  ) as EscrowLayout;

  if (!decodedEscrowState.isInitialized) {
    logError("Escrow state initialization flag has not been set");
    process.exit(1);
  } else if (
    !new PublicKey(decodedEscrowState.initializerPubkey).equals(
      aliceKeypair.publicKey
    )
  ) {
    logError(
      "InitializerPubkey has not been set correctly / not been set to Alice's public key"
    );
    process.exit(1);
  } else if (
    !new PublicKey(
      decodedEscrowState.initializerReceivingTokenAccountPubkey
    ).equals(aliceXTokenAccountPubkey)
  ) {
    logError(
      "initializerReceivingTokenAccountPubkey has not been set correctly / not been set to Alice's Y public key"
    );
    process.exit(1);
  } else if (
    !new PublicKey(decodedEscrowState.initializerTempTokenAccountPubkey).equals(
      tempXTokenAccountKeypair.publicKey
    )
  ) {
    logError(
      "initializerTempTokenAccountPubkey has not been set correctly / not been set to temp X token account public key"
    );
    process.exit(1);
  }
//  console.log(
//    `✨Escrow successfully initialized. Alice is offering ${terms.bobExpectedAmount}X for ${terms.aliceExpectedAmount}Y✨\n`
//  );
  writePublicKey(escrowKeypair.publicKey, "escrow");

  console.log("Alice initiates contract: $2 payment for her dog to be walked")

  console.table([
    {
      "Alice Token Account X": await getTokenBalance(
        aliceXTokenAccountPubkey,
        connection
      ),
    //  "Alice Token Account Y": await getTokenBalance(
    //    aliceYTokenAccountPubkey,
    //    connection
    //  ),
    "Contract": await getTokenBalance(
      tempXTokenAccountKeypair.publicKey,
      connection
    ),

  //    "Bob Token Account X": await getTokenBalance(
  //      getPublicKey("bob_x"),
  //      connection
  //    ),
    //  "Bob Token Account Y": await getTokenBalance(
    //    getPublicKey("bob_y"),
    //    connection
    //  ),
    },
  ]);

  console.log("");
};

alice();

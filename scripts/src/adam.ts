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

const adam = async () => {
  const escrowProgramId = getProgramId();
  const terms = getTerms();

  const adamXTokenAccountPubkey = getPublicKey("adam_x");
  //const aliceYTokenAccountPubkey = getPublicKey("alice_y");
  const XTokenMintPubkey = getPublicKey("mint_x");
  const adamKeypair = getKeypair("adam");

  const tempadamXTokenAccountKeypair = new Keypair();
  const connection = new Connection("http://localhost:8899", "confirmed");
  console.log("creating adam temp account ...");
  const createTempAdamTokenAccountIx = SystemProgram.createAccount({
    programId: TOKEN_PROGRAM_ID,
    space: AccountLayout.span,
    lamports: await connection.getMinimumBalanceForRentExemption(
      AccountLayout.span
    ),
    fromPubkey: adamKeypair.publicKey,
    newAccountPubkey: tempadamXTokenAccountKeypair.publicKey,
  });
  console.log("initialise adam temp account ...");
  const initTempAdamAccountIx = Token.createInitAccountInstruction(
    TOKEN_PROGRAM_ID,
    XTokenMintPubkey,
    tempadamXTokenAccountKeypair.publicKey,
    adamKeypair.publicKey
  );
  console.log("transfer token x to adam temp account ...");
  const transferAdamXTokensToTempAccIx = Token.createTransferInstruction(
    TOKEN_PROGRAM_ID,
    adamXTokenAccountPubkey,
    tempadamXTokenAccountKeypair.publicKey,
    adamKeypair.publicKey,
    [],
    terms.bobExpectedAmount
  );
  const escrowAdamKeypair = new Keypair();
  console.log("creating adam escrow account ...");
  const createAdamEscrowAccountIx = SystemProgram.createAccount({
    space: ESCROW_ACCOUNT_DATA_LAYOUT.span,
    lamports: await connection.getMinimumBalanceForRentExemption(
      ESCROW_ACCOUNT_DATA_LAYOUT.span
    ),
    fromPubkey: adamKeypair.publicKey,
    newAccountPubkey: escrowAdamKeypair.publicKey,
    programId: escrowProgramId,
  });
  console.log("initialising escrow account ...");
  const initAdamEscrowIx = new TransactionInstruction({
    programId: escrowProgramId,
    keys: [
      { pubkey: adamKeypair.publicKey, isSigner: true, isWritable: false },
      {
        pubkey: tempadamXTokenAccountKeypair.publicKey,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: adamXTokenAccountPubkey,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: escrowAdamKeypair.publicKey, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(
      Uint8Array.of(0, ...new BN(terms.adamExpectedAmount).toArray("le", 8))
    ),
  });

  console.log("creating the Adam transaction ...");
  const tx = new Transaction().add(
    createTempAdamTokenAccountIx,
    initTempAdamAccountIx,
    transferAdamXTokensToTempAccIx,
    createAdamEscrowAccountIx,
    initAdamEscrowIx
  );
  console.log("Sending Adam's transaction...");
  await connection.sendTransaction(
    tx,
    [adamKeypair, tempadamXTokenAccountKeypair, escrowAdamKeypair],
    { skipPreflight: false, preflightCommitment: "confirmed" }
  );

  // sleep to allow time to update
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("getting account info of escrow Account ...");
  const escrowAdamAccount = await connection.getAccountInfo(
    escrowAdamKeypair.publicKey
  );
  console.log("getting escrow account info ...complete ...")

  if (escrowAdamAccount === null || escrowAdamAccount.data.length === 0) {
    logError("Escrow state account has not been initialized properly");
    process.exit(1);
  }

  const encodedAdamEscrowState = escrowAdamAccount.data;
  const decodedAdamEscrowState = ESCROW_ACCOUNT_DATA_LAYOUT.decode(
    encodedAdamEscrowState
  ) as EscrowLayout;

  if (!decodedAdamEscrowState.isInitialized) {
    logError("Escrow state initialization flag has not been set");
    process.exit(1);
  } else if (
    !new PublicKey(decodedAdamEscrowState.initializerPubkey).equals(
      adamKeypair.publicKey
    )
  ) {
    logError(
      "InitializerPubkey has not been set correctly / not been set to Adam's public key"
    );
    process.exit(1);
  } else if (
    !new PublicKey(
      decodedAdamEscrowState.initializerReceivingTokenAccountPubkey
    ).equals(adamXTokenAccountPubkey)
  ) {
    logError(
      "initializerReceivingTokenAccountPubkey has not been set correctly / not been set to Adam's Y public key"
    );
    process.exit(1);
  } else if (
    !new PublicKey(decodedAdamEscrowState.initializerTempTokenAccountPubkey).equals(
      tempadamXTokenAccountKeypair.publicKey
    )
  ) {
    logError(
      "initializerTempTokenAccountPubkey has not been set correctly / not been set to temp X token account public key"
    );
    process.exit(1);
  }
  console.log(
    `✨Escrow successfully initialized. Adam is offering ${terms.bobExpectedAmount}X for ${terms.adamExpectedAmount}Y✨\n`
  );
  writePublicKey(escrowAdamKeypair.publicKey, "escrow");
  console.table([
    {
      "Adam Token Account X": await getTokenBalance(
        adamXTokenAccountPubkey,
        connection
      ),
    //  "Alice Token Account Y": await getTokenBalance(
    //    aliceYTokenAccountPubkey,
    //    connection
    //  ),
    "Contract": await getTokenBalance(
      tempadamXTokenAccountKeypair.publicKey,
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

adam();

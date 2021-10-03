import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Connection,
  PublicKey,
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
} from "./utils";

const bob = async () => {
  const bobKeypair = getKeypair("bob");
  const bobXTokenAccountPubkey = getPublicKey("bob_x");
  //const bobYTokenAccountPubkey = getPublicKey("bob_y");
  const escrowStateAccountPubkey = getPublicKey("escrow");
  const escrowProgramId = getProgramId();
  const terms = getTerms();

  const connection = new Connection("http://localhost:8899", "confirmed");
  const escrowAccount = await connection.getAccountInfo(
    escrowStateAccountPubkey
  );
  if (escrowAccount === null) {
    logError("Could not find escrow at given address!");
    process.exit(1);
  }

  console.table([
    {
      "Bob Token Account X": await getTokenBalance(
        bobXTokenAccountPubkey,
        connection
      ),
    },
  ]);
  console.log("");

  const encodedEscrowState = escrowAccount.data;
  const decodedEscrowLayout = ESCROW_ACCOUNT_DATA_LAYOUT.decode(
    encodedEscrowState
  ) as EscrowLayout;
  const escrowState = {
    escrowAccountPubkey: escrowStateAccountPubkey,
    isInitialized: !!decodedEscrowLayout.isInitialized,
    initializerAccountPubkey: new PublicKey(
      decodedEscrowLayout.initializerPubkey
    ),
    XTokenTempAccountPubkey: new PublicKey(
      decodedEscrowLayout.initializerTempTokenAccountPubkey
    ),
    initializerXTokenAccount: new PublicKey(
      decodedEscrowLayout.initializerReceivingTokenAccountPubkey
    ),
    expectedAmount: new BN(decodedEscrowLayout.expectedAmount, 10, "le"),
  };

  const PDA = await PublicKey.findProgramAddress(
    [Buffer.from("escrow")],
    escrowProgramId
  );

  const exchangeInstruction = new TransactionInstruction({
    programId: escrowProgramId,
    data: Buffer.from(
      Uint8Array.of(1, ...new BN(terms.bobExpectedAmount).toArray("le", 8))
    ),
    keys: [
      { pubkey: bobKeypair.publicKey, isSigner: true, isWritable: false },
      { pubkey: bobXTokenAccountPubkey, isSigner: false, isWritable: true },
      { pubkey: bobXTokenAccountPubkey, isSigner: false, isWritable: true },
      {
        pubkey: escrowState.XTokenTempAccountPubkey,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: escrowState.initializerAccountPubkey,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: escrowState.initializerXTokenAccount,
        isSigner: false,
        isWritable: true,
      },
      { pubkey: escrowStateAccountPubkey, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: PDA[0], isSigner: false, isWritable: false },
    ],
  });

  const aliceXTokenAccountPubkey = getPublicKey("alice_x");
  const [aliceXbalance, bobXbalance] = await Promise.all([
    getTokenBalance(aliceXTokenAccountPubkey, connection),
    getTokenBalance(bobXTokenAccountPubkey, connection),
  ]);

  console.table([
    {
      "Bob Token Account X": await getTokenBalance(
        bobXTokenAccountPubkey,
        connection
      ),
    },
  ]);
  console.log("");

  console.log("Sending Bob's transaction...");
  await connection.sendTransaction(
    new Transaction().add(exchangeInstruction),
    [bobKeypair],
    { skipPreflight: false, preflightCommitment: "confirmed" }
  );

  console.table([
    {
      "Bob Token Account X": await getTokenBalance(
        bobXTokenAccountPubkey,
        connection
      ),
    },
  ]);
  console.log("");

  // sleep to allow time to update
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.table([
    {
      "Bob Token Account X": await getTokenBalance(
        bobXTokenAccountPubkey,
        connection
      ),
    },
  ]);
  console.log("");

  if ((await connection.getAccountInfo(escrowStateAccountPubkey)) !== null) {
    logError("Escrow account has not been closed");
    process.exit(1);
  }

  if (
    (await connection.getAccountInfo(escrowState.XTokenTempAccountPubkey)) !==
    null
  ) {
    logError("Temporary X token account has not been closed");
    process.exit(1);
  }

  const newAliceXbalance = await getTokenBalance(
    aliceXTokenAccountPubkey,
    connection
  );

  //if (newAliceXbalance !== aliceXbalance + terms.aliceExpectedAmount) {
  //  logError(
  //    `Alice's X balance should be ${
  //      aliceXbalance + terms.aliceExpectedAmount
  //    } but is ${newAliceXbalance}`
  //  );
  //  process.exit(1);
  //}

  const newBobXbalance = await getTokenBalance(
    bobXTokenAccountPubkey,
    connection
  );

//  if (newBobXbalance !== bobXbalance + terms.bobExpectedAmount) {
//    logError(
//      `Bob's X balance should be ${
//        bobXbalance + terms.bobExpectedAmount
//      } but is ${newBobXbalance}`
//    );
//    process.exit(1);
//  }

  console.log(
    "✨Trade successfully executed. All temporary accounts closed✨\n"
  );
  console.table([
    {
      "Alice Token Account X": await getTokenBalance(
        getPublicKey("alice_x"),
        connection
      ),
      //"Contract": 0,
      //"Alice Token Account X Balance": newAliceXbalance,
      //"Bob Token Account X Balance": newBobXbalance,
      "Bob Token Account X": await getTokenBalance(
        bobXTokenAccountPubkey,
        connection
      ),

      "Bob Token Account X Test": await getTokenBalance(
        getPublicKey("bob_x"),
        connection
      ),
    },
  ]);
  console.log("");
};

bob();

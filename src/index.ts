import "dotenv/config";
import nebulaExecute from "./thirdweb/nebulaExecute.js";
import nebulaCreateSession from "./thirdweb/nebulaCreateSession.js";
import { checkEnvironmentVariables } from "./utils/envCheck.js";
import { account } from "./utils/createAccountFromPrivateKey.js";
import { polygon } from "thirdweb/chains";
import nebulaChat from "./thirdweb/nebulaChat.js";

async function main() {
  checkEnvironmentVariables(); // Check if you've set all the environment variables

  // Create a new session to remember context from the chat
  const session = await nebulaCreateSession({
    title: "My session",
  });

  // Example: Add specific context to our agent - e.g our preferred USDC on polygon.
  console.log(
    await nebulaChat({
      prompt:
        "Remember that the USDC contract address is 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      context: {
        chains: [polygon],
      },
      sessionId: session.result.id,
    })
  );

  console.log(
    await nebulaChat({
      prompt: "What is my USDC balance?",
      context: {
        chains: [polygon],
      },
      sessionId: session.result.id,
    })
  );

  //Transfer 0.1 POL to 0x1f4233E96993C94e37Bbd6C8bee455376625b09A
  //Should also support ENS domain names
  console.log(
    await nebulaExecute({
      prompt:
        "Transfer 0.1 MATIC to 0x1f4233E96993C94e37Bbd6C8bee455376625b09A",
      // prompt:
      // "Swap 1 USDC for POL with 10% slippage."
      context: {
        chains: [polygon],
      },
      account: account,
    })
  );
}

main();

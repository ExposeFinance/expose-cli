import "dotenv/config";
import nebulaChat from "./thirdweb/nebulaChat.js";
import nebulaExecute from "./thirdweb/nebulaExecute.js";
import nebulaCreateSession from "./thirdweb/nebulaCreateSession.js";
import { checkEnvironmentVariables } from "./utils/envCheck.js";
import { account } from "./utils/createAccountFromPrivateKey.js";
import { sepolia } from "thirdweb/chains";
import readline from "readline";
import { sendTransaction } from "thirdweb";

async function main() {
  // Ensure required environment variables are set
  checkEnvironmentVariables();

  // Create a new session to remember context across prompts
  const session = await nebulaCreateSession({
    title: "My session",
  });

  // Suggested prompts for chat and execute actions (example suggestions)
  const suggestions = {
    chat: [
      "What ERC standards are implemented by contract address 0x59325733eb952a92e069C87F0A6168b29E80627f on Ethereum?",
      "What functions can I use to mint more of my contract's NFTs?",
      "How much ETH is in my wallet?",
      "What is the wallet address of vitalik.eth?",
      "What is the last block on zkSync?",
      "What is the current gas price on Avalanche C-Chain?",
      "What is the address of USDC on Ethereum?",
      "Is there a UNI token on Arbitrum?",
      "What is the current price of ARB?",
    ],
    execute: [
      "Send 0.1 ETH to vitalik.eth",
      "Transfer 1 USDC to saminacodes.eth on Base",
      "Deploy a Token ERC20 Contract",
      "Deploy a Split contract with two recipients.",
      "Deploy an ERC1155 Contract named 'Hello World' with description 'Hello badges on Ethereum'",
      "Transfer 0.1 MATIC to 0x1f4233E96993C94e37Bbd6C8bee455376625b09A",
      "Swap 1 USDC for POL with 10% slippage.",
    ],
  };

  // Create a readline interface for CLI input/output
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Helper function to wrap rl.question in a Promise with explicit types
  const askQuestion = (question: string): Promise<string> =>
    new Promise((resolve: (answer: string) => void) => {
      rl.question(question, resolve);
    });

  //Remember that USDC contract address is 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
  await nebulaChat({
    prompt:
      "Remember that USDC contract address is 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    context: { chains: [sepolia] },
    sessionId: session.result.id,
  });
  console.log("Welcome! You can now interact with the agent.");
  console.log(
    "Type 'chat' for a chat call, 'execute' for an execute call, or 'exit' to quit.\n"
  );

  // Main loop
  while (true) {
    // Ask the user which type of call to make
    const callType: string = (
      await askQuestion("Enter call type (chat/execute/exit): ")
    )
      .trim()
      .toLowerCase();

    if (callType === "exit") {
      console.log("Exiting...");
      break;
    }

    let selectedPrompt: string = "";
    if (callType === "chat" || callType === "execute") {
      const suggestionsList: string[] =
        callType === "chat" ? suggestions.chat : suggestions.execute;

      // Display suggestions
      console.log("\nSuggested Prompts:");
      suggestionsList.forEach((s, idx) => {
        console.log(`  ${idx + 1}. ${s}`);
      });
      console.log("  0. Enter a custom prompt");

      // Ask user to select a suggestion by number (or enter 0 for a custom prompt)
      const choiceInput = await askQuestion(
        "Select a suggestion by number (or 0 for custom prompt): "
      );
      const choice = Number(choiceInput.trim());

      if (isNaN(choice) || choice < 0 || choice > suggestionsList.length) {
        console.log("Invalid selection. Please try again.");
        continue;
      }

      if (choice === 0) {
        selectedPrompt = await askQuestion("Enter your custom prompt: ");
      } else {
        selectedPrompt = suggestionsList[choice - 1];
      }
    } else {
      console.log(
        "Invalid call type. Please enter 'chat', 'execute', or 'exit'."
      );
      continue;
    }

    // Process the call based on the selected type
    if (callType === "chat") {
      try {
        const response = await nebulaChat({
          prompt: selectedPrompt,
          context: { chains: [sepolia] },
          sessionId: session.result.id,
        });
        console.log("\nChat Response:");
        console.log(response.message);

        // If there are transactions in the response, show them and ask to execute
        if (response.transactions && response.transactions.length > 0) {
          console.log("\nThe following transactions are ready to be executed:");
          response.transactions.forEach((tx: any, idx: number) => {
            console.log(`\nTransaction ${idx + 1}:`);
            console.log(`  To: ${tx.to}`);
            console.log(`  Value: ${tx.value}`);
            console.log(`  Data: ${tx.data}`);
          });
          const executeChoice = (
            await askQuestion(
              "\nDo you want to execute these transactions? (y/n): "
            )
          )
            .trim()
            .toLowerCase();
          if (executeChoice === "y" || executeChoice === "yes") {
            for (const tx of response.transactions) {
              try {
                const txHash = await sendTransaction({
                  transaction: tx,
                  account,
                });
                console.log(
                  `Transaction executed successfully. Tx Hash: ${txHash?.transactionHash}`
                );
              } catch (err) {
                console.error("Error executing transaction:", err);
              }
            }
          } else {
            console.log("Transactions were not executed.");
          }
        }
      } catch (error: unknown) {
        console.error("Error during nebulaChat:", error);
      }
    } else if (callType === "execute") {
      try {
        const response = await nebulaExecute({
          prompt: selectedPrompt,
          context: { chains: [sepolia] },
          account: account,
        });
        console.log("\nExecute Response:");
        console.log(response.transactionHash);
      } catch (error: unknown) {
        console.error("Error during nebulaExecute:", error);
      }
    } else {
      console.log(
        "Invalid call type. Please enter 'chat', 'execute', or 'exit'."
      );
    }
    console.log(); // Empty line for readability
  }

  // Close the readline interface
  rl.close();
}

main();

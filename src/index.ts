import "dotenv/config";
import nebulaChat from "./thirdweb/nebulaChat.js";
import nebulaExecute from "./thirdweb/nebulaExecute.js";
import nebulaCreateSession from "./thirdweb/nebulaCreateSession.js";
import { checkEnvironmentVariables } from "./utils/envCheck.js";
import { account } from "./utils/createAccountFromPrivateKey.js";
import { polygon } from "thirdweb/chains";
import readline from "readline";

async function main() {
  // Ensure required environment variables are set
  checkEnvironmentVariables();

  // Create a new session to remember context across prompts
  const session = await nebulaCreateSession({
    title: "My session",
  });

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

  console.log("Welcome! You can now interact with the agent.");
  console.log(
    "Type 'chat' for a chat call, 'execute' for an execute call, or 'exit' to quit."
  );
  console.log("For each call, a prompt must be typed.\n");

  // Start an infinite loop to continuously prompt for user input
  while (true) {
    // Ask the user which type of call to make
    const callType: string = (
      await askQuestion("Enter call type (chat/execute/exit): ")
    )
      .trim()
      .toLowerCase();

    // Exit the loop if the user types 'exit'
    if (callType === "exit") {
      console.log("Exiting...");
      break;
    }

    // Ask for the prompt
    const promptText: string = await askQuestion("Enter your prompt: ");

    // Process the call based on the selected type
    if (callType === "chat") {
      try {
        const response = await nebulaChat({
          prompt: promptText,
          context: { chains: [polygon] },
          sessionId: session.result.id,
        });
        console.log("Chat Response:", response);
      } catch (error: unknown) {
        console.error("Error during nebulaChat:", error);
      }
    } else if (callType === "execute") {
      try {
        const response = await nebulaExecute({
          prompt: promptText,
          context: { chains: [polygon] },
          account: account,
        });
        console.log("Transaction Hash:", response.transactionHash);
      } catch (error: unknown) {
        console.error("Error during nebulaExecute:", error);
      }
    } else {
      console.log(
        "Invalid call type. Please enter 'chat', 'execute', or 'exit'."
      );
    }

    console.log(); // Print an empty line for better readability between prompts
  }

  // Close the readline interface
  rl.close();
}

main();

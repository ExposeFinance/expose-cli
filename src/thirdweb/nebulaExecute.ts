import { Nebula } from "thirdweb/ai";
import { Account } from "thirdweb/wallets";
import { client } from "./thirdwebClient.js";
import { account } from "../utils/createAccountFromPrivateKey.js";

type NebulaExecuteInput = Omit<Nebula.Input, "client"> & {
  client?: Nebula.Input["client"];
  account: Account;
};

export default async function nebulaExecute(input: NebulaExecuteInput) {
  try {
    const result = await Nebula.execute({
      ...input,
      client: input.client || client,
      account: account as Account,
    } as Nebula.Input & { account: Account });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

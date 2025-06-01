import { PublicClient } from "viem";
import { baseSepolia, optimismSepolia, sepolia } from "viem/chains";

export const validateClientNetwork = (
  publicClient: PublicClient<any, any, any, any>
) => {
  const clientChainId = publicClient.chain?.id;

  if (clientChainId === baseSepolia.id) {
    return;
  }

  if (clientChainId === optimismSepolia.id) {
    return;
  }

  if (clientChainId === sepolia.id) {
    return;
  }

  throw new Error("Client network is not supported");
};

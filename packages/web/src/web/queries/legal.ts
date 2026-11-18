import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";
/** Public contact address for the privacy policy and support pages. */
export function useContact() {
  return useQuery({
    ...orpc.legal.contact.queryOptions(),
    staleTime: Infinity,
  });
}
/** Permanently deletes the signed-in account and all of its data. */
export function useDeleteAccount() {
  return useMutation(orpc.account.delete.mutationOptions());
}

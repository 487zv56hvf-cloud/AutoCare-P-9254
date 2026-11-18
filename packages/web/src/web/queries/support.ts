import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
export function useSendFeedback() {
  return useMutation(orpc.feedback.send.mutationOptions());
}
export function useSupport() {
  return useMutation(orpc.support.send.mutationOptions());
}
export function useOwner() {
  return useQuery(orpc.owner.me.queryOptions());
}
export function useOwnerFeedback(
  show: "new" | "read" | "all",
  enabled: boolean,
) {
  return useQuery({
    ...orpc.owner.feedback.queryOptions({ input: { show } }),
    enabled,
  });
}
export function useOwnerChats(show: "open" | "done" | "all", enabled: boolean) {
  return useQuery({
    ...orpc.owner.inbox.queryOptions({ input: { show } }),
    enabled,
  });
}
export function useConversation(conversationId: string) {
  return useQuery({
    ...orpc.owner.conversation.queryOptions({ input: { conversationId } }),
    enabled: !!conversationId,
  });
}
export function useReadFeedback() {
  const qc = useQueryClient();
  return useMutation(
    orpc.owner.setFeedbackRead.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.owner.key() }),
    }),
  );
}
export function useHandleChat() {
  const qc = useQueryClient();
  return useMutation(
    orpc.owner.setHandled.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.owner.key() }),
    }),
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

/** Cars of one account; the id in the key keeps accounts' caches apart. */
export function carsQueryOptions(userId: string) {
  return {
    ...orpc.backup.list.queryOptions(),
    queryKey: [...orpc.backup.list.queryOptions().queryKey, userId],
  };
}
export function useCars(userId: string) {
  return useQuery(carsQueryOptions(userId));
}
export function useSaveCar() {
  const qc = useQueryClient();
  return useMutation(
    orpc.backup.save.mutationOptions({
      onSuccess: () =>
        qc.invalidateQueries({
          queryKey: orpc.backup.list.queryOptions().queryKey,
        }),
    }),
  );
}
export function useRemoveCar() {
  const qc = useQueryClient();
  return useMutation(
    orpc.backup.remove.mutationOptions({
      onSuccess: () =>
        qc.invalidateQueries({
          queryKey: orpc.backup.list.queryOptions().queryKey,
        }),
    }),
  );
}
export function useFindCar() {
  return useMutation(orpc.backup.findByPlate.mutationOptions());
}

/** Worldwide VIN lookup (auto.dev + NHTSA) done on the server so the key stays private. */
export function useVinDecode() {
  return useMutation(orpc.vin.decode.mutationOptions());
}

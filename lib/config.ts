import { getStoreConfig as getStoreConfigFromDb, type StoreConfig } from "@/lib/db"

export const getStoreConfig = async (): Promise<StoreConfig> => {
  return await getStoreConfigFromDb()
}

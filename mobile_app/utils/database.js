import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

let dbInstance = null;
const DB_VERSION = "2.0_sahih";

export const getDatabase = async () => {
  if (dbInstance) return dbInstance;

  if (Platform.OS === "web") {
    // Web fallback
    if (SQLite.openDatabaseSync) {
      dbInstance = SQLite.openDatabaseSync("rahnavard.db");
    }
    return dbInstance;
  }

  const dbName = "rahnavard.db";
  const expectedMinSize = 50 * 1024 * 1024; // 50MB
  const dbDir = FileSystem.documentDirectory + "SQLite";
  const dbPath = dbDir + "/" + dbName;

  const dirInfo = await FileSystem.getInfoAsync(dbDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
  }

  const dbInfo = await FileSystem.getInfoAsync(dbPath);
  const storedVersion = await AsyncStorage.getItem("db_version");

  if (
    !dbInfo.exists ||
    !dbInfo.size ||
    dbInfo.size < expectedMinSize ||
    storedVersion !== DB_VERSION
  ) {
    console.log("Extracting pre-populated SQLite database (v" + DB_VERSION + ") to:", dbPath);
    if (dbInfo.exists) {
      await FileSystem.deleteAsync(dbPath, { idempotent: true });
    }

    const asset = Asset.fromModule(require("../assets/rahnavard.db"));
    await asset.downloadAsync();
    const sourceUri = asset.localUri || asset.uri;

    await FileSystem.copyAsync({
      from: sourceUri,
      to: dbPath,
    });

    await AsyncStorage.setItem("db_version", DB_VERSION);
    const verified = await FileSystem.getInfoAsync(dbPath);
    console.log("Database successfully extracted! Size:", verified.size, "bytes");
  }

  if (SQLite.openDatabaseSync) {
    dbInstance = SQLite.openDatabaseSync(dbName, {}, dbDir);
  } else {
    dbInstance = SQLite.openDatabase(dbName);
  }
  return dbInstance;
};

export const queryDatabase = async (db, sql, params = []) => {
    // Handling modern expo-sqlite (SDK 51+) vs older versions
    if (db.getAllAsync) {
        return await db.getAllAsync(sql, params);
    } else {
        return new Promise((resolve, reject) => {
            db.transaction(tx => {
                tx.executeSql(sql, params, 
                    (_, { rows }) => resolve(rows._array),
                    (_, error) => { reject(error); return false; }
                );
            });
        });
    }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const BOUNDARY = 'quranrag_backup_boundary';

const findBackupFileId = async (accessToken) => {
  const q = encodeURIComponent("name = 'quranrag_backup.json' and 'appDataFolder' in parents and trashed = false");
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&spaces=appDataFolder`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!response.ok) {
    throw new Error('Failed to query Google Drive');
  }
  
  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
};

export const syncToDrive = async (accessToken) => {
  // 1. Gather all local data
  const bookmarks = await AsyncStorage.getItem('bookmarks');
  const app_settings = await AsyncStorage.getItem('app_settings');
  const chat_history = await AsyncStorage.getItem('chat_sessions_v2');
  
  const backupData = {
    bookmarks: bookmarks ? JSON.parse(bookmarks) : [],
    app_settings: app_settings ? JSON.parse(app_settings) : {},
    chat_sessions_v2: chat_history ? JSON.parse(chat_history) : [],
    timestamp: new Date().toISOString()
  };

  // 2. Check if file already exists
  const fileId = await findBackupFileId(accessToken);

  // 3. Construct manual multipart request (React Native FormData can be buggy with JSON blobs)
  const metadata = {
    name: 'quranrag_backup.json',
  };
  
  if (!fileId) {
    metadata.parents = ['appDataFolder'];
  }

  const delimiter = `\r\n--${BOUNDARY}\r\n`;
  const close_delim = `\r\n--${BOUNDARY}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(backupData) +
    close_delim;

  const url = fileId 
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const response = await fetch(url, {
    method: fileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
      
    },
    body: multipartRequestBody
  });

  if (!response.ok) {
    throw new Error('Failed to upload backup to Google Drive');
  }

  return true;
};

export const syncFromDrive = async (accessToken) => {
  const fileId = await findBackupFileId(accessToken);
  if (!fileId) {
    return false; // No backup exists yet
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error('Failed to download backup from Google Drive');
  }

  const data = await response.json();

  // Save the downloaded data to local storage
  if (data.bookmarks) await AsyncStorage.setItem('bookmarks', JSON.stringify(data.bookmarks));
  if (data.app_settings) await AsyncStorage.setItem('app_settings', JSON.stringify(data.app_settings));
  if (data.chat_sessions_v2) await AsyncStorage.setItem('chat_sessions_v2', JSON.stringify(data.chat_sessions_v2));

  return true;
};

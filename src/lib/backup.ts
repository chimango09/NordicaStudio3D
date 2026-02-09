'use client';

import { Firestore, collection, getDocs } from 'firebase/firestore';

const COLLECTIONS_TO_BACKUP = ['clients', 'filaments', 'accessories', 'quotes', 'expenses', 'settings'];

interface BackupData {
  [key: string]: any[];
}

/**
 * Fetches all data for a given user and generates a downloadable JSON file.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user whose data to back up.
 */
export async function generateBackup(firestore: Firestore, userId: string): Promise<void> {
  const backupData: BackupData = {};
  
  const backupPromises = COLLECTIONS_TO_BACKUP.map(async (collectionName) => {
    const colRef = collection(firestore, 'users', userId, collectionName);
    const snapshot = await getDocs(colRef);
    const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    backupData[collectionName] = docsData;
  });

  await Promise.all(backupPromises);

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().split('T')[0];
  a.download = `backup-nordica-studio-3d-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

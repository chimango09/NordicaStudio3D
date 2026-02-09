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


function convertToCSV(data: any[]): string {
    if (!data || data.length === 0) {
        return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
        const values = headers.map(header => {
            let cell = row[header];

            if (typeof cell === 'object' && cell !== null) {
                cell = JSON.stringify(cell);
            }

            const stringCell = String(cell ?? '');
            const escaped = stringCell.replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

/**
 * Fetches data from a specific collection and triggers a CSV file download.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @param collectionName The name of the collection to back up.
 */
export async function generateCsvForCollection(firestore: Firestore, userId:string, collectionName: string): Promise<void> {
    const colRef = collection(firestore, 'users', userId, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
        throw new Error(`No hay datos en ${collectionName} para exportar.`);
    }

    const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const csvString = convertToCSV(docsData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `${collectionName}-backup-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}


'use client';

import { Firestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const COLLECTIONS_TO_BACKUP = ['clients', 'filaments', 'accessories', 'products', 'quotes', 'expenses', 'settings'];

const collectionDisplayNames: { [key: string]: string } = {
  clients: "Clientes",
  filaments: "Filamentos",
  accessories: "Accesorios",
  products: "Catálogo de Piezas",
  quotes: "Cotizaciones",
  expenses: "Gastos",
  settings: "Configuración",
};

/**
 * Fetches all data for a given user and generates a downloadable Excel file
 * with each collection in a separate sheet.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user whose data to back up.
 */
export async function generateExcelBackup(firestore: Firestore, userId: string): Promise<void> {
  const wb = XLSX.utils.book_new();

  const backupPromises = COLLECTIONS_TO_BACKUP.map(async (collectionName) => {
    try {
      const colRef = collection(firestore, 'users', userId, collectionName);
      const snapshot = await getDocs(colRef);
      let docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (['quotes', 'trash', 'products'].includes(collectionName)) {
          docsData = docsData.map(doc => {
              const newDoc: {[key: string]: any} = {};
              for(const key in doc) {
                  if(typeof (doc as any)[key] === 'object' && (doc as any)[key] !== null) {
                      newDoc[key] = JSON.stringify((doc as any)[key]);
                  } else {
                      newDoc[key] = (doc as any)[key];
                  }
              }
              return newDoc;
          });
      }

      if (docsData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(docsData);

        const colWidths = Object.keys(docsData[0]).map(key => {
          let maxLength = key.length;
          docsData.forEach(row => {
            const value = String((row as any)[key] || '');
            if (value.length > maxLength) {
              maxLength = value.length;
            }
          });
          return { wch: maxLength + 2 }; 
        });
        ws['!cols'] = colWidths;
        
        const sheetName = collectionDisplayNames[collectionName] || collectionName;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    } catch (error) {
      console.error(`Error backing up collection ${collectionName}:`, error);
    }
  });

  await Promise.all(backupPromises);
  
  if (wb.SheetNames.length === 0) {
    throw new Error('No hay datos para exportar.');
  }

  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `backup-nordica-studio-3d-${date}.xlsx`);
}


/**
 * Generates a JSON backup of all user data.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user whose data to back up.
 */
export async function generateJsonBackup(firestore: Firestore, userId: string): Promise<void> {
  const backupData: { [key: string]: any[] } = {};

  const backupPromises = COLLECTIONS_TO_BACKUP.map(async (collectionName) => {
    try {
      const colRef = collection(firestore, 'users', userId, collectionName);
      const snapshot = await getDocs(colRef);
      const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (docsData.length > 0) {
        backupData[collectionName] = docsData;
      }
    } catch (error) {
      console.error(`Error backing up collection ${collectionName} for JSON:`, error);
    }
  });

  await Promise.all(backupPromises);

  if (Object.keys(backupData).length === 0) {
    throw new Error('No hay datos para exportar.');
  }

  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(backupData, null, 2)
  )}`;
  const link = document.createElement("a");
  link.href = jsonString;
  const date = new Date().toISOString().split('T')[0];
  link.download = `backup-json-nordica-studio-3d-${date}.json`;

  link.click();
}

/**
 * Imports data from a JSON backup file, overwriting existing data.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user to restore data for.
 * @param data The parsed JSON data from the backup file.
 */
export async function importJsonBackup(firestore: Firestore, userId: string, data: { [key: string]: any[] }): Promise<void> {
  const collectionsInData = Object.keys(data);
  const isValid = collectionsInData.length > 0 && collectionsInData.every(c => COLLECTIONS_TO_BACKUP.includes(c));
  
  if (!isValid) {
    throw new Error("El archivo JSON no es un backup válido o está dañado.");
  }

  const batch = writeBatch(firestore);

  for (const collectionName of collectionsInData) {
    const collectionData = data[collectionName];
    if (Array.isArray(collectionData)) {
      for (const docData of collectionData) {
        if (docData.id) {
          const { id, ...rest } = docData;
          const docRef = doc(firestore, 'users', userId, collectionName, id);
          batch.set(docRef, rest);
        }
      }
    }
  }

  await batch.commit();
}

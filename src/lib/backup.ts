'use client';

import { Firestore, collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const COLLECTIONS_TO_BACKUP = ['clients', 'filaments', 'accessories', 'quotes', 'expenses', 'settings'];

const collectionDisplayNames: { [key: string]: string } = {
  clients: "Clientes",
  filaments: "Filamentos",
  accessories: "Accesorios",
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

      // Flatten nested objects (like in quotes) for better readability in Excel
      if (['quotes', 'trash'].includes(collectionName)) {
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

        // Auto-fit columns for better readability
        const colWidths = Object.keys(docsData[0]).map(key => {
          let maxLength = key.length;
          docsData.forEach(row => {
            const value = String((row as any)[key] || '');
            if (value.length > maxLength) {
              maxLength = value.length;
            }
          });
          return { wch: maxLength + 2 }; // +2 for a little padding
        });
        ws['!cols'] = colWidths;
        
        const sheetName = collectionDisplayNames[collectionName] || collectionName;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    } catch (error) {
      console.error(`Error backing up collection ${collectionName}:`, error);
      // We can decide to either throw an error or just log it and continue
    }
  });

  await Promise.all(backupPromises);
  
  if (wb.SheetNames.length === 0) {
    throw new Error('No hay datos para exportar.');
  }

  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `backup-nordica-studio-3d-${date}.xlsx`);
}

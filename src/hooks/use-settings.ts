"use client";

import { useMemo } from 'react';
import { collection, doc } from 'firebase/firestore';
import { useCollection, useFirestore, setDocumentNonBlocking, useUser } from '@/firebase';
import type { Setting, Settings } from '@/lib/types';

const DEFAULT_SETTINGS: Settings = {
  electricityCost: 0.15,
  machineCost: 0.5,
  printerConsumptionWatts: 150,
  profitMargin: 30,
  currency: 'ARS$',
  companyName: 'Nórdica Studio 3D',
  companyResponsible: 'Equipo Nórdica Studio',
  companyPhone: '+54 9 11 1234-5678',
  companyEmail: 'contacto@nordica3d.com',
  companyLocation: 'Buenos Aires, Argentina',
  companyLogo: '',
  backupReminderDays: 7,
};

export function useSettings() {
  const firestore = useFirestore();
  const { user } = useUser();
  const settingsCollection = useMemo(() => user ? collection(firestore, 'users', user.uid, 'settings') : null, [firestore, user?.uid]);
  const { data: settingsData, isLoading, error } = useCollection<Setting>(settingsCollection);

  const settings = useMemo(() => {
    if (!settingsData) {
      return DEFAULT_SETTINGS;
    }
    const settingsObj = settingsData.reduce((acc, setting) => {
      // Don't parse numbers for string settings
      if (['companyName', 'companyResponsible', 'companyPhone', 'companyEmail', 'companyLocation', 'currency', 'companyLogo'].includes(setting.id)) {
        return { ...acc, [setting.id]: setting.value };
      }
      const value = parseFloat(setting.value);
      return { ...acc, [setting.id]: isNaN(value) ? setting.value : value };
    }, {} as any);
    return { ...DEFAULT_SETTINGS, ...settingsObj };
  }, [settingsData]);

  const saveSettings = (newSettings: Partial<Settings>) => {
    if (!user) return;
    Object.entries(newSettings).forEach(([key, value]) => {
      if (value !== undefined) {
        const settingRef = doc(firestore, 'users', user.uid, 'settings', key);
        setDocumentNonBlocking(settingRef, { value: String(value) }, { merge: true });
      }
    });
  };

  return { settings, isLoading, error, saveSettings };
}

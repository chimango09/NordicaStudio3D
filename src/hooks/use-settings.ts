"use client";

import { useMemo } from 'react';
import { collection, doc } from 'firebase/firestore';
import { useCollection, useFirestore, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import type { Setting, Settings } from '@/lib/types';

const DEFAULT_SETTINGS: Settings = {
  electricityCost: 0.15,
  machineCost: 0.5,
  profitMargin: 30,
  currency: 'ARS$',
};

export function useSettings() {
  const firestore = useFirestore();
  const settingsCollection = useMemoFirebase(() => collection(firestore, 'settings'), [firestore]);
  const { data: settingsData, isLoading, error } = useCollection<Setting>(settingsCollection);

  const settings = useMemo(() => {
    if (!settingsData) {
      return DEFAULT_SETTINGS;
    }
    const settingsObj = settingsData.reduce((acc, setting) => {
      const value = parseFloat(setting.value);
      return { ...acc, [setting.id]: isNaN(value) ? setting.value : value };
    }, {} as any);
    return { ...DEFAULT_SETTINGS, ...settingsObj };
  }, [settingsData]);

  const saveSettings = (newSettings: Partial<Settings>) => {
    Object.entries(newSettings).forEach(([key, value]) => {
      if (value !== undefined) {
        const settingRef = doc(firestore, 'settings', key);
        setDocumentNonBlocking(settingRef, { value: String(value) }, { merge: true });
      }
    });
  };

  return { settings, isLoading, error, saveSettings };
}

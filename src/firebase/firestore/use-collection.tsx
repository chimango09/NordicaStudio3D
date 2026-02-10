'use client';

import { useState, useEffect } from 'react';
import {
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  collection,
  CollectionReference,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase'; // Using the barrel file
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * It now uses a standard useEffect dependency array to manage subscriptions correctly.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {string | null | undefined} path - The string path to the Firestore collection.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    path: string | null | undefined,
): UseCollectionResult<T> {
  const firestore = useFirestore();
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!path || !firestore) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let collectionRef: CollectionReference;
    try {
        collectionRef = collection(firestore, path);
    } catch (e: any) {
        console.error("Error creating collection reference:", e);
        setError(e);
        setIsLoading(false);
        return;
    }

    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (snapshotError: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: collectionRef.path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [path, firestore]);

  return { data, isLoading, error };
}

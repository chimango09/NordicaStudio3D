'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  collection,
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
 * It memoizes the collection reference to prevent re-subscribing on every render.
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

  // Memoize the collection reference. This is the key to preventing infinite loops.
  // The reference is only re-created if the path or the firestore instance changes.
  const collectionRef = useMemo(() => {
    if (!path || !firestore) return null;
    try {
        return collection(firestore, path);
    } catch (e) {
        console.error("Error creating collection reference:", e);
        return null;
    }
  }, [path, firestore]);

  useEffect(() => {
    if (!collectionRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

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
  }, [collectionRef]);

  return { data, isLoading, error };
}

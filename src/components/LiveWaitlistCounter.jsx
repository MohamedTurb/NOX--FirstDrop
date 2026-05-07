import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function LiveWaitlistCounter({ collectionName = 'waitlist', className = '' }) {
  const [count, setCount] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    const colRef = collection(db, collectionName);

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        setCount(snapshot.size);
      },
      (err) => {
        console.error('Live counter onSnapshot error:', err);
        setError('Unable to load live count');
      }
    );

    return () => unsubscribe();
  }, [collectionName]);

  return (
    <div className={`${className} w-full flex items-center justify-center py-4 px-3 sm:py-6 sm:px-4`} aria-live="polite">
      <div className="text-center">
        <div className="text-[clamp(2.5rem,6vw,4.5rem)] sm:text-[clamp(3rem,6vw,5rem)] md:text-[clamp(3.5rem,6vw,6rem)] font-extrabold tracking-tight text-white">
          {count === null ? '—' : count}
        </div>
        <div className="mt-1 text-xs sm:text-sm uppercase tracking-widest text-white/60">people joined</div>
      </div>
    </div>
  );
}

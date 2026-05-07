import React, { useEffect, useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { subscribeWaitlist, subscribeLeaderboard, exportWaitlistCSV } from '../firebaseHelpers';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Ensure the firebase client is initialized for auth usage (uses same config as src/firebase.js)
import firebaseConfig from '../firebaseConfig.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [leaders, setLeaders] = useState([]);
  const [bypassPassword, setBypassPassword] = useState('');
  const [devMode, setDevMode] = useState(false);
  const functions = getFunctions(app);
  
  // Simple bypass for development (use ?bypass=dev in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bypass = params.get('bypass');
    if (bypass === 'dev') {
      setDevMode(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setIsAdmin(false);
        return;
      }
      // If dev mode bypass active, auto-admin
      if (devMode) {
        setIsAdmin(true);
        return;
      }
      const idTokenResult = await u.getIdTokenResult();
      setIsAdmin(!!idTokenResult.claims.isAdmin);
    });
    return () => unsubscribe();
  }, [devMode]);

  useEffect(() => {
    let unsubUsers = null;
    let unsubLeaders = null;
    if (isAdmin || devMode) {
      unsubUsers = subscribeWaitlist((items, size) => {
        console.log(`[Admin] Waitlist updated: ${size} items`);
        setUsers(items);
        setTotal(size);
      });
      unsubLeaders = subscribeLeaderboard((items) => {
        console.log(`[Admin] Leaders updated: ${items.length} leaders`);
        setLeaders(items);
      }, 50);
    }
    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubLeaders) unsubLeaders();
    };
  }, [isAdmin, devMode]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Login error', err);
      const errorCode = err.code || 'unknown';
      const errorMsg = err.message || 'Unknown error';
      
      // Provide more helpful error messages
      let message = 'Login failed';
      if (errorCode === 'auth/cancelled-popup-request') {
        message = 'Sign-in cancelled';
      } else if (errorCode === 'auth/popup-blocked') {
        message = 'Popup blocked — please allow popups for this site';
      } else if (errorCode === 'auth/web-storage-unsupported') {
        message = 'Web storage not supported — try a different browser';
      } else if (errorCode === 'auth/operation-not-supported-in-this-environment') {
        message = 'Operation not supported — check Firebase configuration';
      } else if (errorMsg.includes('sign-in provider')) {
        message = 'Google Sign-in not configured in Firebase Console';
      }
      
      alert(`${message}\n\n(${errorCode})`);
    }
  };

  const handleExport = async () => {
    if (!isAdmin) return alert('Not authorized');
    const csv = await exportWaitlistCSV();
    if (!csv) {
      alert('No data to export');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nox_waitlist.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSoldOut = async () => {
    if (!isAdmin) return alert('Not authorized');
    try {
      const fn = httpsCallable(functions, 'updateLaunchConfig');
      const res = await fn({ soldOut: true });
      alert('Marked sold out');
    } catch (err) {
      console.error(err);
      alert('Failed to update');
    }
  };

  const setVipWindow = async () => {
    if (!isAdmin) return alert('Not authorized');
    const hours = prompt('VIP window hours (e.g. 48)');
    const n = parseInt(hours || '0');
    if (isNaN(n) || n <= 0) return;
    try {
      const fn = httpsCallable(functions, 'updateLaunchConfig');
      await fn({ vipWindowHours: n });
      alert('VIP window set');
    } catch (err) {
      console.error(err);
      alert('Failed to update');
    }
  };

  if (!devMode && (!user || !isAdmin)) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Admin Login</h2>
        <div className="flex gap-2">
          <button onClick={login} className="rounded bg-white px-4 py-2 font-semibold">Sign in with Google</button>
        </div>
        <p className="mt-4 text-sm text-white/70">Sign in with a Google account that has the `isAdmin` custom claim.</p>
        <p className="mt-2 text-xs text-white/50">💡 For development: use <code className="bg-white/10 px-2 py-1 rounded">/admin?bypass=dev</code></p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {devMode && (
        <div className="mb-4 rounded bg-yellow-500/20 border border-yellow-500/50 p-3 text-sm text-yellow-200">
          ⚠️ Dev Mode Active — No authentication required
        </div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-semibold">NOX Admin Dashboard</h2>
        <div className="flex gap-2">
          <button onClick={handleExport} className="rounded bg-white px-4 py-2 font-semibold text-black">Export CSV</button>
          {user ? <button onClick={() => signOut(auth)} className="rounded bg-white/5 px-4 py-2">Sign out</button> : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded bg-white/5 p-4">
          <div className="text-sm text-white/60">Total Waitlist</div>
          <div className="mt-2 text-3xl font-bold">{total}</div>
        </div>
          <div className="rounded bg-white/5 p-4">
          <div className="text-sm text-white/60">Top Referrers</div>
          <div className="mt-2">
            {leaders.length === 0 ? (
              <div className="text-sm text-white/40">No referrers yet</div>
            ) : (
              leaders.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-1">
                  <div>{l.name || l.email || l.referralId}</div>
                  <div className="font-semibold">{l.invitesCount || 0}</div>
                </div>
              ))
            )}
          </div>
        </div>
          <div className="rounded bg-white/5 p-4">
          <div className="text-sm text-white/60">Quick Actions</div>
          <div className="mt-2 flex flex-col gap-2">
            <button onClick={toggleSoldOut} className="rounded bg-white/5 px-3 py-2 text-sm sm:text-base">Mark Sold Out</button>
            <button onClick={setVipWindow} className="rounded bg-white/5 px-3 py-2 text-sm sm:text-base">Set VIP window</button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-base sm:text-lg font-semibold mb-2">Waitlist Users</h3>
        <div className="overflow-auto rounded bg-white/5">
          {users.length === 0 ? (
            <div className="p-6 text-center text-white/50">
              <p>No users in waitlist yet</p>
              <p className="text-xs mt-2">Check Firestore security rules if data should exist</p>
            </div>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-white/60">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Instagram</th>
                  <th className="px-4 py-2">Referral ID</th>
                  <th className="px-4 py-2">Referred By</th>
                  <th className="px-4 py-2">Invites</th>
                  <th className="px-4 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-white/5 text-xs sm:text-sm">
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.instagram}</td>
                    <td className="px-4 py-2">{u.referralId}</td>
                    <td className="px-4 py-2">{u.referredBy}</td>
                    <td className="px-4 py-2">{u.invitesCount || 0}</td>
                    <td className="px-4 py-2">{u.createdAt?.toDate ? new Date(u.createdAt.toDate()).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

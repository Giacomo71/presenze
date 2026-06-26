import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';

export default function BillImportPage() {
  const router = useRouter();

  const handleSuccess = async (credentialResponse) => {
    // Send credential to our backend to exchange for tokens
    const res = await fetch('/api/google-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: credentialResponse.credential }),
    });
    if (res.ok) {
      router.push('/bill-import/selection');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 text-white p-8">
      <h1 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>Importa Bollette da Google Drive</h1>
      <p className="mb-4 text-lg">Collega il tuo account Google per selezionare le fatture di gas e luce.</p>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.log('Login Failed')}
      />
      <style jsx>{`
        .google-login-button {
          transition: transform 0.2s;
        }
        .google-login-button:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}

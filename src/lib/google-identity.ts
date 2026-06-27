let scriptLoader: Promise<void> | null = null;
let clientIdLoader: Promise<string> | null = null;

declare global {
  interface Window {
    google?: any;
  }
}

function loadGoogleScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google login hanya tersedia di browser.'));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!scriptLoader) {
    scriptLoader = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Gagal memuat Google Identity script.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Gagal memuat Google Identity script.'));
      document.head.appendChild(script);
    });
  }

  return scriptLoader;
}

async function resolveGoogleClientId(clientId?: string): Promise<string> {
  if (clientId?.trim()) {
    return clientId.trim();
  }

  if (!clientIdLoader) {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    clientIdLoader = fetch(`${apiBaseUrl.replace(/\/$/, '')}/auth/google/client-config`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('GOOGLE_CLIENT_ID belum dikonfigurasi di backend.');
        }

        const payload = (await response.json()) as { clientId?: string };
        if (!payload?.clientId?.trim()) {
          throw new Error('GOOGLE_CLIENT_ID tidak ditemukan.');
        }

        return payload.clientId.trim();
      })
      .catch((error) => {
        clientIdLoader = null;
        throw error;
      });
  }

  return clientIdLoader;
}

export async function requestGoogleIdToken(clientId?: string): Promise<string> {
  const resolvedClientId = await resolveGoogleClientId(clientId);
  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    let resolved = false;

    window.google.accounts.id.initialize({
      client_id: resolvedClientId,
      callback: (response: { credential?: string }) => {
        if (response?.credential) {
          resolved = true;
          resolve(response.credential);
          return;
        }

        reject(new Error('Tidak mendapatkan token dari Google.'));
      },
    });

    window.google.accounts.id.prompt((notification: any) => {
      if (resolved) {
        return;
      }

      if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
        reject(new Error('Popup Google tidak tersedia atau dibatalkan.'));
      }
    });
  });
}

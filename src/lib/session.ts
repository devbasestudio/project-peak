const encoder = new TextEncoder();

async function getCryptoKey() {
  const secret = process.env.JWT_SECRET || 'super-secret-jwt-key-project-peak-2026';
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// Convert base64 url encoding helpers
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

export interface SessionPayload {
  userId: number;
  role: 'admin' | 'user';
  username: string;
  email: string;
  exp?: number;
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  const key = await getCryptoKey();
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  
  // Set default expiration to 7 days
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const encodedPayload = base64UrlEncode(JSON.stringify({ ...payload, exp }));
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${encodedHeader}.${encodedPayload}`)
  );
  
  const signature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  );
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const key = await getCryptoKey();
    
    // Verify signature
    const signatureBytes = Uint8Array.from(base64UrlDecode(signature), (c) =>
      c.charCodeAt(0)
    );
    const verified = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(`${header}.${payload}`)
    );
    
    if (!verified) return null;
    
    // Decode payload
    const decodedPayload = JSON.parse(base64UrlDecode(payload)) as SessionPayload;
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return decodedPayload;
  } catch (e) {
    return null;
  }
}

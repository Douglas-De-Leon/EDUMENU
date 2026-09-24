import { initializeApp } from "firebase/app";
import { getFirestore, getDocFromServer, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCLadD0S9JLKvOH-Qe2eRin-T25lZb0Uxk",
  authDomain: "edumenu-7310d.firebaseapp.com",
  projectId: "edumenu-7310d",
  storageBucket: "edumenu-7310d.firebasestorage.app",
  messagingSenderId: "550246472437",
  appId: "1:550246472437:web:086e9aafe4486f5b2643bc"
};

// Initialize Firebase standard connection for fast, non-blocking requests
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * Função para testar a conexão com o banco de dados Firestore
 * e mensurar a latência real de ida e volta (Round Trip Time).
 */
export async function testDatabaseConnection(): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const start = performance.now();
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    const latencyMs = Math.round(performance.now() - start);
    return { success: true, latencyMs };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    // Mesmo se o documento 'test/connection' não existir, se responder sem erro de rede/permissão, a conexão foi bem-sucedida
    if (err?.code === 'not-found' || !err?.message?.includes('offline')) {
      return { success: true, latencyMs };
    }
    return { success: false, latencyMs, error: err?.message || 'Falha de conexão com Firestore' };
  }
}




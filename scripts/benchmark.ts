import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, query, where, limit } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCLadD0S9JLKvOH-Qe2eRin-T25lZb0Uxk",
  authDomain: "edumenu-7310d.firebaseapp.com",
  projectId: "edumenu-7310d",
  storageBucket: "edumenu-7310d.firebasestorage.app",
  messagingSenderId: "550246472437",
  appId: "1:550246472437:web:086e9aafe4486f5b2643bc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runBenchmark() {
  console.log("=== INICIANDO TESTES DE PERFORMANCE COM O FIRESTORE ===");
  
  const startTotal = Date.now();

  // Teste 1: Teste de Conexão inicial
  const t0 = Date.now();
  try {
    const testSnap = await getDoc(doc(db, 'schools', 'escola-principal'));
    console.log(`[OK] Leitura de documento pontual (schools/escola-principal): ${Date.now() - t0}ms | Existe: ${testSnap.exists()}`);
  } catch (err) {
    console.error(`[ERRO] Leitura pontual falhou:`, err);
  }

  // Teste 2: Alunos
  const t1 = Date.now();
  const studentsSnap = await getDocs(collection(db, 'students'));
  console.log(`[OK] Coleção 'students' (${studentsSnap.size} registros): ${Date.now() - t1}ms`);

  // Teste 3: Admins
  const t2 = Date.now();
  const adminsSnap = await getDocs(collection(db, 'admins'));
  console.log(`[OK] Coleção 'admins' (${adminsSnap.size} registros): ${Date.now() - t2}ms`);

  // Teste 4: Meals (Candidatos / Opções)
  const t3 = Date.now();
  const mealsSnap = await getDocs(collection(db, 'meals'));
  console.log(`[OK] Coleção 'meals' (${mealsSnap.size} registros): ${Date.now() - t3}ms`);

  // Teste 5: Voting Sessions (Votações)
  const t4 = Date.now();
  const sessionsSnap = await getDocs(collection(db, 'voting_sessions'));
  console.log(`[OK] Coleção 'voting_sessions' (${sessionsSnap.size} registros): ${Date.now() - t4}ms`);

  // Teste 6: Attendance (Frequência)
  const t5 = Date.now();
  const attendanceSnap = await getDocs(collection(db, 'attendance'));
  console.log(`[OK] Coleção 'attendance' (${attendanceSnap.size} registros): ${Date.now() - t5}ms`);

  // Teste 7: Selections (Votos)
  const t6 = Date.now();
  const selectionsSnap = await getDocs(collection(db, 'selections'));
  console.log(`[OK] Coleção 'selections' (${selectionsSnap.size} registros): ${Date.now() - t6}ms`);

  // Teste 8: Consulta paralela simultânea (Como no login)
  const tParallel = Date.now();
  await Promise.all([
    getDocs(collection(db, 'schools')),
    getDocs(collection(db, 'admins')),
    getDocs(collection(db, 'meals')),
    getDocs(collection(db, 'voting_sessions')),
    getDocs(collection(db, 'attendance'))
  ]);
  console.log(`[OK] 5 consultas em paralelo (Promise.all): ${Date.now() - tParallel}ms`);

  // Teste 9: Busca direta de aluno por Matrícula (Ex: '01838575260')
  const tStudent = Date.now();
  const studentSnap = await getDoc(doc(db, 'students', '01838575260'));
  console.log(`[OK] Login Aluno Direto (01838575260): ${Date.now() - tStudent}ms | Encontrado: ${studentSnap.exists()}`);

  // Teste 10: Busca direta de Admin por Login
  const tAdmin = Date.now();
  const adminQuery = query(collection(db, 'admins'), where('login', '==', 'admin-miguel'), limit(1));
  const adminSnap = await getDocs(adminQuery);
  console.log(`[OK] Login Admin Query (admin-miguel): ${Date.now() - tAdmin}ms | Encontrado: ${!adminSnap.empty}`);

  console.log(`=== TESTES CONCLUÍDOS COM SUCESSO! Tempo total: ${Date.now() - startTotal}ms ===`);
  process.exit(0);
}

runBenchmark().catch(err => {
  console.error("Erro fatal no benchmark:", err);
  process.exit(1);
});

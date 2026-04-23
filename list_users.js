import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function listUsers() {
  try {
    const studentsSnap = await getDocs(collection(db, 'students'));
    console.log("=== ALUNOS CADASTRADOS ===");
    if (studentsSnap.empty) {
      console.log("Nenhum aluno encontrado.");
    } else {
      studentsSnap.forEach(doc => {
        const data = doc.data();
        console.log(`- Nome: ${data.name} | Matrícula: ${data.matricula} | Senha: ${data.password}`);
      });
    }

    console.log("\n=== GESTORES CADASTRADOS ===");
    const adminsSnap = await getDocs(collection(db, 'admins'));
    if (adminsSnap.empty) {
      console.log("Nenhum gestor encontrado.");
    } else {
      adminsSnap.forEach(doc => {
        const data = doc.data();
        console.log(`- Nome: ${data.name} | Login: ${data.login} | Senha: ${data.password}`);
      });
    }
  } catch (error) {
    console.error("Erro ao listar:", error);
  }
  process.exit(0);
}
listUsers();

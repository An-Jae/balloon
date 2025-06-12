import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCNLSAX_gpK1xP2H7EfDYv3w4fWWt3qaw4",
    authDomain: "ballon-cupid.firebaseapp.com",
    projectId: "ballon-cupid",
    storageBucket: "ballon-cupid.firebasestorage.app",
    messagingSenderId: "1022691458662",
    appId: "1:1022691458662:web:f9ff53e316fdbe1a5977a7"
  };
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

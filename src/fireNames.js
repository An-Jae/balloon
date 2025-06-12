// src/fireNames.js
import { db } from "./firebase"; // firebase 초기화 된 인스턴스
import { collection, addDoc, getDocs, doc, deleteDoc } from "firebase/firestore";

const namesCollection = collection(db, "names");

export async function fetchNames() {
  const snapshot = await getDocs(namesCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addName(name) {
  return await addDoc(namesCollection, { name });
}

export async function deleteName(id) {
  return await deleteDoc(doc(db, "names", id));
}

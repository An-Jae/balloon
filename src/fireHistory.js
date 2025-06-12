// fireHistory.js
import { db } from "./firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  Timestamp
} from "firebase/firestore";

const historyCollection = collection(db, "balloon-history");

export async function addHistory(nameObj) {
  await addDoc(historyCollection, {
    name: nameObj.name,
    createdAt: Timestamp.now()
  });
}

export async function fetchHistory() {
  const snapshot = await getDocs(historyCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// ✅ 전체 이력 삭제 함수
export async function clearAllHistory() {
  const snapshot = await getDocs(historyCollection);
  const promises = snapshot.docs.map(docSnap =>
    deleteDoc(doc(db, "balloon-history", docSnap.id))
  );
  await Promise.all(promises);
}

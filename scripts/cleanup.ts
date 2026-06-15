import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function runCleanup() {
  console.log("Starting cleanup...");

  // 1. Delete instances of brand "Orange"
  const brandsSnap = await getDocs(collection(db, 'brands'));
  const batch = writeBatch(db);
  let count = 0;
  brandsSnap.forEach(snap => {
    const data = snap.data();
    if (data.name === 'Orange' || data.name?.toLowerCase() === 'orange') {
      batch.delete(snap.ref);
      count++;
    }
  });

  // 2. Delete batches where batchCode is "20241221"
  const batchesSnap = await getDocs(collection(db, 'batches'));
  batchesSnap.forEach(snap => {
    const data = snap.data();
    if (data.batchCode === '20241221' || data.brandName === 'Orange' || data.brandName?.toLowerCase() === 'orange') {
      batch.delete(snap.ref);
      count++;
    }
  });

  // 3. Delete evaluations where batchCode is "20241221"
  const evalsSnap = await getDocs(collection(db, 'evaluations'));
  evalsSnap.forEach(snap => {
    const data = snap.data();
    if (data.batchCode === '20241221' || data.brandName === 'Orange' || data.brandName?.toLowerCase() === 'orange') {
      batch.delete(snap.ref);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Deleted ${count} documents.`);
  } else {
    console.log("Nothing to delete.");
  }
}

runCleanup().then(() => {
  console.log("Done.");
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});

const admin = require('firebase-admin');
const fs = require('fs');
const { Parser } = require('json2csv');

// Path to your service account key JSON file
const serviceAccount = require('C:\\Users\\rk092\\my-react-app\\roadsafe-wildlife-firebase-adminsdk-fbsvc-363f77d225.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function exportReports() {
  try {
    const reportsSnapshot = await db.collection('reports').get();

    const reports = [];
    reportsSnapshot.forEach(doc => {
      reports.push({ id: doc.id, ...doc.data() });
    });

    if (reports.length === 0) {
      console.log('No reports found.');
      return;
    }

    // Export JSON
    fs.writeFileSync('reports.json', JSON.stringify(reports, null, 2));
    console.log('Exported reports.json');

    // Export CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(reports);
    fs.writeFileSync('reports.csv', csv);
    console.log('Exported reports.csv');

  } catch (error) {
    console.error('Error exporting reports:', error);
  }
}

exportReports();
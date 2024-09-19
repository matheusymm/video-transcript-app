import admin from 'firebase-admin';

// Importa as credenciais do Firebase Admin SDK
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Verifica se as credenciais foram definidas
if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not defined');
}

// Converte as credenciais para JSON
const serviceAccount = JSON.parse(serviceAccountKey) as admin.ServiceAccount;

// Inicializa o Firebase Admin SDK
if(!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export const adminAuth = admin.auth();
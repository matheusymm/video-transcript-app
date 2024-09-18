import admin from 'firebase-admin';
import credential from '../video-transcript-b010e-firebase-adminsdk-u9kry-efdbcb795b.json'

if(!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(credential as admin.ServiceAccount),
    });
}

export const adminAuth = admin.auth();
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, getDoc, getDocs, setDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseConfig } from './config';

initializeApp(firebaseConfig());

const db = getFirestore();

export const firestore = {
    getCollectionId: async function (companyId) {
        const q = query(collection(db, "companies"), where("id", "==", companyId));
        const querySnapshot = await getDocs(q);
        let data;
        querySnapshot.forEach((doc) => {
            data = doc.id;
        });
        return data;
    },
    getKebuns: async function (collection_id) {
        const q = query(collection(db, `companies/${collection_id}/kebuns`));
        const querySnapshot = await getDocs(q);
        let data = [];
        querySnapshot.forEach((doc) => {
            data.push(doc.data());
        });
        return data;
    },
    getPupuks: async function (layerId) {
        const q = query(collection(db, "companies/KhkpYLQ1U4PMDZoio9lc/kebuns/7aKWb6Wm0SiO4b3WobUR/pupuks"), where("layer_id", "==", layerId, orderBy("tanggal", "asc")));
        const querySnapshot = await getDocs(q);
        let data = [];
        querySnapshot.forEach((doc) => {
            data.push(doc.data());
        });
        return data;
    },
    // getGeoserver: async function (companyId) {
    //     this.getCollectionId(companyId).then(function (data) {
    //         console.log(data);
    //     })
    // },
    // getOnce: async function () {
    //     const docRef = doc(db, "companies", "KhkpYLQ1U4PMDZoio9lc");
    //     const docSnap = await getDoc(docRef);

    //     if (docSnap.exists()) {
    //         console.log("Document data:", docSnap.data());
    //     } else {
    //         // doc.data() will be undefined in this case
    //         console.log("No such document!");
    //     }
    // },
}

export const auth = {
    init: function () {
        const getauth = getAuth();
        const provider = new GoogleAuthProvider();
        signInWithPopup(getauth, provider)
            .then((result) => {
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const user = {
                    email: result.user.email, 
                    nama: result.user.displayName,
                    photo: result.user.photoURL,
                    uid: result.user.uid,
                    token: credential.accessToken,
                    company_id: 'SS_21_01',
                    role: 'user'
                };
                console.log(user);
                this.saveUser(user);
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                const email = error.email;
                const credential = GoogleAuthProvider.credentialFromError(error);
            });
    },
    saveUser: async function (user) {
        const ref = collection(db, "users");
        await setDoc(doc(ref, user.uid), user);
    }
}
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, getDoc, getDocs, setDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseConfig } from './config';
import { Modal, Offcanvas } from 'bootstrap';

initializeApp(firebaseConfig());

const db = getFirestore();

export const firestore = {
    onLogin: async function (username, password) {
        const q = query(collection(db, `users`), where("username", "==", username), where("password", "==", password));
        const querySnapshot = await getDocs(q);
        let data;
        querySnapshot.forEach((doc) => {
            data = doc.data();
        });
        delete data.password;
        return data;
    },
    getCompany: async function (companyId) {
        const q = query(collection(db, "companies"), where("id", "==", companyId));
        const querySnapshot = await getDocs(q);
        let data;
        querySnapshot.forEach((doc) => {
            data = {
                ...doc.data(),
                collection: doc.id
            }
        });
        delete data.id;
        return data;
    },
    getKebuns: async function (collectionId) {
        const q = query(collection(db, `companies/${collectionId}/kebuns`));
        const querySnapshot = await getDocs(q);
        let data = [];
        querySnapshot.forEach((doc) => {
            const temp = {
                ...doc.data(),
                collection: doc.id
            }
            data.push(temp);
        });
        return data;
    },
    getBlokData: async function (collectionId, kebunId, field, layerId) {
        const ref = collection(db, `companies/${collectionId}/kebuns/${kebunId}/${field}`);
        const q = query(ref, where("layer_id", "==", layerId));
        const querySnapshot = await getDocs(q);
        let data;
        querySnapshot.forEach((doc) => {
            data = doc.data();
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
                // console.log(user);
                this.saveUser(user);
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                const email = error.email;
                const credential = GoogleAuthProvider.credentialFromError(error);
            });

        /* const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        signInWithEmailAndPassword(getauth, email, password)
            .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;
                // ...

                document.getElementById('form-login').reset();

                console.log('logged in');
                document.getElementById('auth-close').click();
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
            }); */
    },
    saveUser: async function (user) {
        const ref = collection(db, "users");
        await setDoc(doc(ref, user.uid), user);
    },
    userSignOut: function () {
        /* const getauth = getAuth();
        signOut(getauth).then(() => {
            // Sign-out successful.
            document.querySelector('.logged-off').classList.toggle('show');
            document.querySelector('.logged-on').classList.toggle('show');
        }).catch((error) => {
            // An error happened.
        }); */
    }
}
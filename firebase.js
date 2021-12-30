import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, getDoc, getDocs, setDoc, query, where, arrayUnion, updateDoc, orderBy, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseConfig } from './config';
import { Modal, Offcanvas } from 'bootstrap';
import { showAlert, stopLoadingButton } from './animated';

initializeApp(firebaseConfig());

const db = getFirestore();

export const firestore = {
    saveUser: async function (user) {
        const ref = collection(db, "users");
        await setDoc(doc(ref), user);

        return true;
    },
    listUser: async function (company_id) {
        const q = query(collection(db, `users`), where("company_id", "==", company_id));
        const querySnapshot = await getDocs(q);
        let data = [];
        querySnapshot.forEach((doc) => {
            data.push(doc.data());
        });
        return data;
    },
    getUser: async function (email) {
        const q = query(collection(db, `users`), where("email", "==", email));
        const querySnapshot = await getDocs(q);
        let data;
        querySnapshot.forEach((doc) => {
            data = doc.data();
        });
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
        if (data)
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
    getBlokColls: async function () {
        const ref = collection(db, `statics`);
        const q = query(ref, where("layer", "==", 'blok'));
        const querySnapshot = await getDocs(q);
        let data;
        querySnapshot.forEach((doc) => {
            data = doc.data().data;
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
    saveBlokData: async function (collectionId, kebunId, field, layerId, docData) {
        let ref = collection(db, `companies/${collectionId}/kebuns/${kebunId}/${field}`);
        const q = query(ref, where("layer_id", "==", layerId));
        const querySnapshot = await getDocs(q);
        let data = [];
        let docId;
        querySnapshot.forEach((doc) => {
            docId = doc.id;
            data = doc.data().data;
        });
        data.push(docData.data[0]);

        if (docId) {
            ref = doc(db, `companies/${collectionId}/kebuns/${kebunId}/${field}`, docId);
            await updateDoc(ref, { data: data });
        } else {
            await addDoc(ref, docData);
        }

        return true;
    }
}

export const auth = {
    addUser: async function (user) {
        const auth = getAuth();
        const createUser = await createUserWithEmailAndPassword(auth, user.email, user.password);

        return createUser;
    },
    userSignIn: function (email, password) {
        const getauth = getAuth();
        signInWithEmailAndPassword(getauth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                getUserData(user.email);
            })
            .catch((error) => {
                stopLoadingButton('onLogin');
                const errorCode = error.code;
                if (errorCode === 'auth/wrong-password') {
                    showAlert('alert-login', 'alert-danger', 'Password Anda salah');
                } else {
                    showAlert('alert-login', 'alert-danger', 'Anda belum terdaftar');
                }
            });
    },
    userSignOut: function () {
        const getauth = getAuth();
        signOut(getauth).then(() => {
            document.querySelector('.logged-off').classList.toggle('show');
            document.querySelector('.logged-on').classList.toggle('show');

            localStorage.setItem('gp|logged-on', 'false');
            localStorage.removeItem('gp|user');
            localStorage.removeItem('gp|company');
            localStorage.removeItem('gp|kebuns');
            localStorage.removeItem('gp|selected_kebun');
            localStorage.removeItem('gp|selected_tahun');
            location.reload();
        }).catch((error) => {
            console.log(error);
        });
    }
}

function getUserData(email) {
    firestore.getUser(email).then((user) => {
        localStorage.setItem('gp|logged-on', 'true');
        localStorage.setItem('gp|user', JSON.stringify(user));

        firestore.getCompany(user.company_id).then((company) => {
            showAlert('alert-login', 'alert-success', 'Login berhasil');
            localStorage.setItem('gp|company', JSON.stringify(company));

            firestore.getKebuns(company.collection).then((kebuns) => {
                stopLoadingButton('onLogin');
                localStorage.setItem('gp|kebuns', JSON.stringify(kebuns));
                localStorage.setItem('gp|selected_kebun', 0);
                localStorage.setItem('gp|selected_tahun', 0);
                location.reload();
            })
        });
    })
}
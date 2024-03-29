import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import {getFirestore, enableIndexedDbPersistence, onSnapshot, collection, query, where, serverTimestamp, doc, setDoc, deleteDoc, getDoc, orderBy, deleteField, getDocs, writeBatch} from 'firebase/firestore'
import { FIREBASE_CONFIG } from "./KEYS";

initializeApp(FIREBASE_CONFIG);

const AUTH = getAuth()
export const getUser = () => {return AUTH.currentUser}
export const listenUser = (callback) => onAuthStateChanged(AUTH, callback)
export const logIn = () => {return signInWithPopup(AUTH, new GoogleAuthProvider())}
export const logOut = () => {return signOut(AUTH)}

const FIRESTORE = getFirestore()
enableIndexedDbPersistence(FIRESTORE).catch(e => console.log(e.code  === 'failed-precondition' ? 'Multiple Tabs Open' : 'Cant Cache ', e))

export const listenData = (path, callback) => {
    return onAuthStateChanged(AUTH, user => {
        return onSnapshot(query(collection(FIRESTORE, path), orderBy(`users.${user?.uid || "_public"}`)), callback)
    })
}
export const getData = path => {return getDoc(doc(FIRESTORE, path))}

const table = (type) => {
    let table = 'PM'; // ['milestone', 'task', 'project']
    if (['transaction'].includes(type)) table = 'MM'
    if (['user'].includes(type)) table = 'UM'
    return collection(FIRESTORE, table)
}

/** func Save Data
 * Milestone - group your tasks together
 * created, id, name, description, done, tags, paused, starting, expiry, users, project
 * */
export const saveData = (data) => {

    if (!['type', 'name'].every(r => Object.keys(data).includes(r)))
        throw Error("Invalid values type and name")

    if (data.type==='milestone' && !['project'].every(r => Object.keys(data).includes(r)))
        throw Error("Invalid Milestone Data")

    const assign = (property, option) => {
        if (!data[property])
            data[property] = option;
    }

    const DATA = table(data.type)
    assign('created', serverTimestamp());
    assign('id', doc(DATA).id);
    assign('users', {});
    assign('tags', []);
    ['starting', 'ending'].forEach(value => {
        if (data[value])
            data[value] = new Date(data[value])
    })

    let tags = data.name.split(" ").filter(n => /^:/.test(n));
    tags.forEach(sep => {
        data.name = data.name.replace(sep, "")
        let tag = sep.replace(":", "")
        if (!data.tags.includes(tag)) data.tags.push(tag)
    })

    let user = AUTH?.currentUser?.uid || '_public';
    if (!data.users[user]) data.users[user] = 1
    Object.keys(data.users).forEach(el => {
        if (!data.users[el]) data.users[el] = deleteField();
    })
    return setDoc(doc(DATA, data.id), data, {merge: true})
}

export const done = data => {
    data.done = serverTimestamp();
    // return saveData(data);
    return deleteData(data)
}

export const deleteData = data => {return deleteDoc(doc(table(data.type), data.id))}
import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    startAfter
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const ACTIVITY_PAGE_SIZE = 100;
const scriptLoads = new Map();

export function recordActivity(db, user, action, details = {}) {
    if (!user) {
        return Promise.reject(new Error("Activity cannot be recorded without a signed-in user."));
    }

    const safeDetails = Object.fromEntries(
        Object.entries(details)
            .slice(0, 8)
            .map(([key, value]) => [key, String(value).slice(0, 500)])
    );

    return addDoc(collection(db, "activity_logs"), {
        uid: user.uid,
        email: user.email || "",
        action: String(action).slice(0, 128),
        details: safeDetails,
        createdAt: serverTimestamp()
    });
}

export async function getActivityPage(db, cursor = null) {
    const constraints = [orderBy("createdAt", "desc")];
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(ACTIVITY_PAGE_SIZE));

    const snapshot = await getDocs(query(collection(db, "activity_logs"), ...constraints));
    const lastDocument = snapshot.docs.length
        ? snapshot.docs[snapshot.docs.length - 1]
        : cursor;

    return {
        entries: snapshot.docs.map(document => ({ id: document.id, ...document.data() })),
        cursor: lastDocument,
        hasMore: snapshot.docs.length === ACTIVITY_PAGE_SIZE
    };
}

export function loadGlobalScript(url, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    if (!scriptLoads.has(url)) {
        const load = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = url;
            script.async = true;
            script.onload = () => {
                if (window[globalName]) resolve(window[globalName]);
                else reject(new Error(`${globalName} did not load correctly.`));
            };
            script.onerror = () => reject(new Error(`Failed to load ${globalName}.`));
            document.head.appendChild(script);
        }).catch(error => {
            scriptLoads.delete(url);
            throw error;
        });
        scriptLoads.set(url, load);
    }
    return scriptLoads.get(url);
}

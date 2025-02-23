const openDB = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const openRequest = window.indexedDB.open("cache", 1);

    openRequest.onsuccess = () => resolve(openRequest.result);

    openRequest.onerror = () => reject(openRequest.error);

    openRequest.onupgradeneeded = ({ oldVersion }) => {
      const db = openRequest.result;

      db.onerror = () => reject(openRequest.error);

      if (oldVersion) {
        db.deleteObjectStore("entry");
      }

      db.createObjectStore("entry");
    };
  });

export const get = async (key: string) => {
  const db = await openDB();

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const tr = db.transaction(["entry"], "readonly");

    const store = tr.objectStore("entry");

    const r = store.get(key);

    r.onerror = () => reject(r.error);

    r.onsuccess = () => resolve(r.result);

    tr.commit();
  }).finally(() => db.close());
};

export const put = async (key: string, value: ArrayBuffer) => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tr = db.transaction(["entry"], "readwrite");

    const store = tr.objectStore("entry");

    const r = store.put(value, key);

    r.onerror = () => reject(r.error);

    r.onsuccess = () => resolve(r.result);

    tr.commit();
  }).finally(() => db.close());
};

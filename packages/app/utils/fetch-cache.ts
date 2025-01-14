const openDB = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const openRequest = window.indexedDB.open("http-cache", 1);

    openRequest.onsuccess = () => resolve(openRequest.result);

    openRequest.onerror = () => reject(openRequest.error);

    openRequest.onupgradeneeded = ({ oldVersion }) => {
      const db = openRequest.result;

      db.onerror = () => reject(openRequest.error);

      if (oldVersion) {
        db.deleteObjectStore("request");
      }

      db.createObjectStore("request");
    };
  });

/**
 * fetch the uri as arraybuffer, or used the cached version from indexedDB
 */
export const fetchCached = async (url: string) => {
  const db = await openDB();

  const key = url;

  const cached = await new Promise<ArrayBuffer>((resolve, reject) => {
    const tr = db.transaction(["request"], "readonly");

    const store = tr.objectStore("request");

    const r = store.get(key);

    r.onerror = () => reject(r.error);

    r.onsuccess = () => resolve(r.result);

    tr.commit();
  });

  if (cached) {
    db.close();
    return cached;
  }

  const fresh = await fetch(url).then((res) => res.arrayBuffer());

  await new Promise((resolve, reject) => {
    const tr = db.transaction(["request"], "readwrite");

    const store = tr.objectStore("request");

    const r = store.put(fresh, key);

    r.onerror = () => reject(r.error);

    r.onsuccess = () => resolve(r.result);

    tr.commit();
  });

  db.close();
  return fresh;
};

import { Injectable } from '@angular/core';

interface ServiceItem {
  id?: number;
  name: string;
  description: string;
  price: number;
}

export interface User {
  id?: number;
  username: string;
  password?: string; // Password should be hashed in a real app
  isAdmin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private dbName = 'TiendaDB';
  private dbVersion = 3; // Incremented version
  private serviceStoreName = 'services';
  private userStoreName = 'users';
  private db: IDBDatabase | null = null;

  constructor() {
    this.openDB();
  }

  private openDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.serviceStoreName)) {
          db.createObjectStore(this.serviceStoreName, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(this.userStoreName)) {
          const userStore = db.createObjectStore(this.userStoreName, { keyPath: 'id', autoIncrement: true });
          // Add a default admin user if the store is new
          userStore.transaction.oncomplete = () => {
            const userTransaction = db.transaction(this.userStoreName, 'readwrite');
            const userObjectStore = userTransaction.objectStore(this.userStoreName);
            userObjectStore.add({ username: 'admin', password: 'password', isAdmin: true });
          };
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private getObjectStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not open');
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Service methods
  async addService(service: ServiceItem): Promise<ServiceItem> {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const request = this.getObjectStore(this.serviceStoreName, 'readwrite').add(service);
      request.onsuccess = (event) => {
        service.id = (event.target as IDBRequest).result as number;
        resolve(service);
      };
      request.onerror = (event) => {
        console.error('Error adding service:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async getServices(): Promise<ServiceItem[]> {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const request = this.getObjectStore(this.serviceStoreName, 'readonly').getAll();
      request.onsuccess = (event) => {
        resolve((event.target as IDBRequest).result);
      };
      request.onerror = (event) => {
        console.error('Error getting services:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async updateService(service: ServiceItem): Promise<ServiceItem> {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const request = this.getObjectStore(this.serviceStoreName, 'readwrite').put(service);
      request.onsuccess = () => {
        resolve(service);
      };
      request.onerror = (event) => {
        console.error('Error updating service:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async deleteService(id: number): Promise<void> {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const request = this.getObjectStore(this.serviceStoreName, 'readwrite').delete(id);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = (event) => {
        console.error('Error deleting service:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  // User methods
  async addUser(user: User): Promise<User> {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const request = this.getObjectStore(this.userStoreName, 'readwrite').add(user);
      request.onsuccess = (event) => {
        user.id = (event.target as IDBRequest).result as number;
        resolve(user);
      };
      request.onerror = (event) => {
        console.error('Error adding user:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(this.userStoreName, 'readonly');
      const request = store.openCursor();
      let user: User | undefined;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.username === username) {
            user = cursor.value;
            resolve(user);
            return;
          }
          cursor.continue();
        } else {
          resolve(undefined);
        }
      };

      request.onerror = (event) => {
        console.error('Error getting user by username:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async updateUser(user: User): Promise<User> {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const request = this.getObjectStore(this.userStoreName, 'readwrite').put(user);
      request.onsuccess = () => {
        resolve(user);
      };
      request.onerror = (event) => {
        console.error('Error updating user:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async deleteUser(id: number): Promise<void> {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const request = this.getObjectStore(this.userStoreName, 'readwrite').delete(id);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = (event) => {
        console.error('Error deleting user:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }
}
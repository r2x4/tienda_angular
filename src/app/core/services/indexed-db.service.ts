import { Injectable } from '@angular/core';
import { Product } from '../../features/tienda/interfaces/product.interface';

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
  private dbVersion = 6; // Incremented version
  private serviceStoreName = 'services';
  private userStoreName = 'users';
  private productStoreName = 'products'; // New store for products
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
          userStore.transaction.oncomplete = () => {
            const userTransaction = db.transaction(this.userStoreName, 'readwrite');
            const userObjectStore = userTransaction.objectStore(this.userStoreName);
            userObjectStore.add({ username: 'admin', password: 'password', isAdmin: true });
          };
        }
        if (!db.objectStoreNames.contains(this.productStoreName)) {
          db.createObjectStore(this.productStoreName, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;

        this.db.onversionchange = () => {
          console.warn('IndexedDB version change detected. Closing database.');
          this.db?.close();
          alert('La base de datos necesita ser actualizada. Por favor, recarga la página.');
        };

        this.db.onclose = () => {
          console.warn('IndexedDB connection closed unexpectedly.');
          this.db = null; // Clear the reference to the closed DB
        };

        resolve();
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };

      request.onblocked = (event) => {
        console.warn('IndexedDB open request blocked:', (event.target as IDBOpenDBRequest).error);
        alert('La base de datos está siendo utilizada en otra pestaña o ventana. Por favor, cierra las otras instancias e inténtalo de nuevo.');
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
        reject((event.target as IDBRequest).error);
      };
    });
  }

  // Product methods
  async addProduct(product: Product): Promise<Product> {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const request = this.getObjectStore(this.productStoreName, 'readwrite').add(product);
      request.onsuccess = (event) => {
        product.id = (event.target as IDBRequest).result as number;
        resolve(product);
      };
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async getProducts(): Promise<Product[]> {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const request = this.getObjectStore(this.productStoreName, 'readonly').getAll();
      request.onsuccess = (event) => {
        resolve((event.target as IDBRequest).result);
      };
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async updateProduct(product: Product): Promise<Product> {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const request = this.getObjectStore(this.productStoreName, 'readwrite').put(product);
      request.onsuccess = () => {
        resolve(product);
      };
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async deleteProduct(id: number): Promise<void> {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const request = this.getObjectStore(this.productStoreName, 'readwrite').delete(id);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = (event) => {
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
        reject((event.target as IDBRequest).error);
      };
    });
  }
}

export const loadData = <T>(key: string, defaultData: T[] = []): T[] => {
  try {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) as T[] : defaultData as T[]; // Explicitly cast defaultData to T[]
  } catch (error) {
    console.error(`Erreur lors du chargement des données pour la clé ${key} depuis le localStorage:`, error);
    return defaultData as T[]; // Explicitly cast defaultData to T[]
  }
};

export const saveData = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde des données pour la clé ${key} dans le localStorage:`, error);
  }
};

export const addData = <T extends { id: string }>(key: string, newData: T): T[] => {
  const existingData = loadData<T>(key);
  const updatedData = [...existingData, newData];
  saveData(key, updatedData);
  return updatedData;
};

export const updateData = <T extends { id: string }>(key: string, updatedItem: T): T[] => {
  const existingData = loadData<T>(key);
  const updatedData = existingData.map(item => item.id === updatedItem.id ? updatedItem : item);
  saveData(key, updatedData);
  return updatedData;
};

export const deleteData = <T extends { id: string }>(key: string, idToDelete: string): T[] => {
  const existingData = loadData<T>(key);
  const updatedData = existingData.filter(item => item.id !== idToDelete);
  saveData(key, updatedData);
  return updatedData;
};
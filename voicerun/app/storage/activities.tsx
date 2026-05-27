import AsyncStorage from '@react-native-async-storage/async-storage';

export type Run = {
  id: string;
  distance: string;
  duration: string;
  calories: string;
  pace: string;
  createdAt: string;
};

const RUN_KEY = 'run';

export const getRun = async (): Promise<Run[]> => {
  const data = await AsyncStorage.getItem(RUN_KEY);
  return data ? JSON.parse(data) : [];
};

export const addRun = async (
  run: Omit<Run, 'id' | 'createdAt'>,
): Promise<Run> => {
  const runs = await getRun();
  const newRun: Run = {
    ...run,
    id: Date.now().toString(),
    createdAt: new Date().toISOString().split('T')[0],
  };
  await AsyncStorage.setItem(RUN_KEY, JSON.stringify([newRun, ...runs]));
  return newRun;
};

export const clearAllRuns = async (): Promise<void> => {
  await AsyncStorage.removeItem(RUN_KEY);
};


import { useState, useEffect } from 'react';
import { storeAPI, type StoreItem, type StoreTransaction } from '../api/store';
import { useToast } from './useToast';
import { useAuth } from './useAuth';

export const useStore = () => {
  const { user, checkAuth } = useAuth();
  const { showToast } = useToast();
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [transactions, setTransactions] = useState<StoreTransaction | null>(null);
  const [loading, setLoading] = useState(false);

  const isStoreOwner = user?.isStoreOwner || false;
  const isStoreMode = user?.storeMode || false;
  const storeName = user?.storeName || '';

  const fetchStoreItems = async () => {
    if (!isStoreOwner) return;
    
    try {
      setLoading(true);
      const items = await storeAPI.getMyStoreItems();
      setStoreItems(items);
    } catch (error) {
      showToast('Failed to load store items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!isStoreOwner) return;
    
    try {
      const data = await storeAPI.getTransactions();
      setTransactions(data);
    } catch (error) {
      showToast('Failed to load transactions', 'error');
    }
  };

  const toggleStoreMode = async () => {
    try {
      setLoading(true);
      await storeAPI.toggleStoreMode();
      await checkAuth(); // Refresh user data
      showToast(
        isStoreMode ? 'Store Mode disabled' : 'Store Mode enabled',
        'success'
      );
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to toggle Store Mode', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isStoreOwner && isStoreMode) {
      fetchStoreItems();
      fetchTransactions();
    }
  }, [isStoreOwner, isStoreMode]);

  return {
    isStoreOwner,
    isStoreMode,
    storeName,
    storeItems,
    transactions,
    loading,
    toggleStoreMode,
    refreshStoreItems: fetchStoreItems,
    refreshTransactions: fetchTransactions
  };
};

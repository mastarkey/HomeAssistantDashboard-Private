import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { haStorage, STORAGE_KEYS } from '../services/haStorage';

export interface CustomCategory {
  id: string;
  name: string;
  icon: ReactNode | string;
  domains: string[];
  isCustom: true;
  createdAt: number;
}

export function useCustomCategories() {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from HA storage on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const stored = await haStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
        if (stored) {
          setCustomCategories(stored);
        }
      } catch (e) {
        // Failed to load custom categories
      } finally {
        setIsLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Save to HA storage whenever customCategories changes
  useEffect(() => {
    if (!isLoading) {
      haStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, customCategories);
    }
  }, [customCategories, isLoading]);

  const addCustomCategory = (name: string, icon: string, domains: string[]) => {
    const id = name.toLowerCase().replace(/\s+/g, '_');
    const newCategory: CustomCategory = {
      id,
      name,
      icon,
      domains,
      isCustom: true,
      createdAt: Date.now(),
    };
    
    setCustomCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const deleteCustomCategory = (categoryId: string) => {
    setCustomCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  const updateCustomCategory = (categoryId: string, updates: Partial<CustomCategory>) => {
    setCustomCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, ...updates } : cat
    ));
  };

  return {
    customCategories,
    addCustomCategory,
    deleteCustomCategory,
    updateCustomCategory,
  };
}
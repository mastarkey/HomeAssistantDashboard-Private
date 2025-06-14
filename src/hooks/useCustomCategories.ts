import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface CustomCategory {
  id: string;
  name: string;
  icon: ReactNode | string;
  domains: string[];
  isCustom: true;
  createdAt: number;
}

const STORAGE_KEY = 'ha_custom_categories';

export function useCustomCategories() {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCustomCategories(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse custom categories:', e);
      }
    }
  }, []);

  // Save to localStorage whenever customCategories changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customCategories));
  }, [customCategories]);

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
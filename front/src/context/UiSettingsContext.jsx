import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { base_url, getAuthHeaders } from "../api/index";
import {
  DEFAULT_UI_SETTINGS,
  isFeatureVisible,
  isOptionEnabled,
  isPageVisible,
  normalizeUiSettings,
} from "../config/uiSettings";

const UiSettingsContext = createContext(null);

export function UiSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_UI_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchSettings = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setSettings(DEFAULT_UI_SETTINGS);
      setLoaded(true);
      return DEFAULT_UI_SETTINGS;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${base_url}/restaurant/ui-settings`, getAuthHeaders());
      const next = normalizeUiSettings(res.data?.ui_settings);
      setSettings(next);
      setLoaded(true);
      return next;
    } catch {
      setSettings(DEFAULT_UI_SETTINGS);
      setLoaded(true);
      return DEFAULT_UI_SETTINGS;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token" && e.newValue) fetchSettings();
      if (e.key === "token" && !e.newValue) {
        setSettings(DEFAULT_UI_SETTINGS);
        setLoaded(false);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchSettings]);

  const updateSettings = useCallback(async (payload) => {
    const res = await axios.put(`${base_url}/restaurant/ui-settings`, payload, getAuthHeaders());
    const next = normalizeUiSettings(res.data?.ui_settings);
    setSettings(next);
    return next;
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      loaded,
      refresh: fetchSettings,
      updateSettings,
      isPageVisible: (key) => isPageVisible(settings, key),
      isFeatureVisible: (key) => isFeatureVisible(settings, key),
      isOptionEnabled: (key) => isOptionEnabled(settings, key),
    }),
    [settings, loading, loaded, fetchSettings, updateSettings]
  );

  return <UiSettingsContext.Provider value={value}>{children}</UiSettingsContext.Provider>;
}

export function useUiSettings() {
  const ctx = useContext(UiSettingsContext);
  if (!ctx) {
    return {
      settings: DEFAULT_UI_SETTINGS,
      loading: false,
      loaded: true,
      refresh: async () => DEFAULT_UI_SETTINGS,
      updateSettings: async () => DEFAULT_UI_SETTINGS,
      isPageVisible: () => true,
      isFeatureVisible: () => true,
      isOptionEnabled: () => false,
    };
  }
  return ctx;
}

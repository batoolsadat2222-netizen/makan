import { createContext, useContext, useState, useEffect, useCallback } from 'react';

import {

  loadSession,

  loadSettings,

  saveSettings,

  loadHistory,

  loginUser as localLogin,

  registerUser as localRegister,

  logoutUser,

  addHistoryItem,

  deleteHistoryItem,

  clearHistory,

  getGuestRemaining,

  incrementGuestUsage,

  incrementUserQuestions,

  getUserStats,

  saveSession,

  saveToken,

  loadToken,

  resolveDarkMode,

} from '../utils/storage';

import { getPlanInfo } from '../utils/plans';

import { apiLogin, apiRegister, apiMe, sendContact as apiSendContact } from '../utils/api';



function isNetworkError(err) {

  return err instanceof TypeError || /failed to fetch|network/i.test(err.message || '');

}



const AppContext = createContext(null);



export function AppProvider({ children }) {

  const [user, setUser] = useState(null);

  const [settings, setSettings] = useState(loadSettings);

  const [history, setHistory] = useState([]);

  const [activePanel, setActivePanel] = useState(null);

  const [guestRemaining, setGuestRemaining] = useState(getGuestRemaining());

  const [toast, setToast] = useState(null);

  const [userStats, setUserStats] = useState(null);

  const [authReady, setAuthReady] = useState(false);



  const refreshUsage = useCallback(() => {

    setGuestRemaining(getGuestRemaining());

  }, []);



  const loadUserHistory = useCallback((sessionUser) => {

    setHistory(loadHistory(sessionUser?.id ?? null));

  }, []);



  const refreshUserStats = useCallback(async () => {

    if (!loadToken()) return;

    const apiUser = await apiMe();

    if (apiUser) {

      setUserStats({ totalQuestions: apiUser.totalQuestions || 0 });

      setUser({ id: apiUser.id, name: apiUser.name, email: apiUser.email });

      saveSession({ id: apiUser.id, name: apiUser.name, email: apiUser.email });

    }

  }, []);



  useEffect(() => {

    async function initAuth() {

      const token = loadToken();

      const session = loadSession();



      if (token) {

        try {

          const apiUser = await apiMe();

          if (apiUser) {

            const s = { id: apiUser.id, name: apiUser.name, email: apiUser.email };

            setUser(s);

            loadUserHistory(s);

            setUserStats({ totalQuestions: apiUser.totalQuestions || 0 });

          } else {

            logoutUser();

            setUser(null);

            loadUserHistory(null);

          }

        } catch {

          if (session) {

            setUser(session);

            loadUserHistory(session);

            setUserStats(getUserStats(session.id));

          } else {

            logoutUser();

            setUser(null);

            loadUserHistory(null);

          }

        }

      } else if (session) {

        setUser(session);

        loadUserHistory(session);

        setUserStats(getUserStats(session.id));

      }



      refreshUsage();

      setAuthReady(true);

    }



    initAuth();

  }, [loadUserHistory, refreshUsage]);



  useEffect(() => {

    const dark = resolveDarkMode(settings);

    document.documentElement.classList.toggle('dark', dark);



    if (settings.themeMode === 'system') {

      const mq = window.matchMedia('(prefers-color-scheme: dark)');

      const handler = () => {

        document.documentElement.classList.toggle('dark', mq.matches);

      };

      mq.addEventListener('change', handler);

      return () => mq.removeEventListener('change', handler);

    }

  }, [settings]);



  const showToast = useCallback((message, type = 'success') => {

    setSettings((current) => {

      if (!current.notifications) return current;

      setToast({ message, type });

      return current;

    });

  }, []);



  const hideToast = useCallback(() => setToast(null), []);



  const updateSettings = useCallback((patch) => {

    setSettings((prev) => {

      const next = { ...prev, ...patch };

      if ('themeMode' in patch) {

        next.darkMode = resolveDarkMode(next);

      }

      saveSettings(next);

      return next;

    });

  }, []);



  const canAskQuestion = useCallback(() => {
    if (user) {
      return { allowed: true, remaining: Infinity };
    }
    const remaining = getGuestRemaining();
    return {
      allowed: remaining > 0,
      remaining,
      message: remaining > 0
        ? null
        : '۳ سوال رایگان امروز تمام شد. برای ادامه، اشتراک بخرید یا ثبت‌نام کنید.',
    };
  }, [user]);



  const recordQuestion = useCallback(() => {
    if (user && loadToken()) {
      refreshUserStats();
    } else {
      incrementGuestUsage();
      refreshUsage();
      if (user && !loadToken()) {
        incrementUserQuestions(user.id);
        setUserStats(getUserStats(user.id));
      }
    }
  }, [user, refreshUsage, refreshUserStats]);



  const login = useCallback(async (data) => {

    try {

      const { user: apiUser, token } = await apiLogin(data);

      saveToken(token);

      const session = { id: apiUser.id, name: apiUser.name, email: apiUser.email };

      saveSession(session);

      setUser(session);

      loadUserHistory(session);

      setUserStats({ totalQuestions: apiUser.totalQuestions || 0 });

      showToast(`خوش آمدید ${apiUser.name}!`);

      return apiUser;

    } catch (apiErr) {

      if (!isNetworkError(apiErr)) throw apiErr;

      const u = localLogin(data);

      const session = { id: u.id, name: u.name, email: u.email };

      setUser(session);

      loadUserHistory(session);

      setUserStats(getUserStats(u.id));

      showToast(`خوش آمدید ${u.name}! (حالت آفلاین)`);

      return u;

    }

  }, [loadUserHistory, showToast]);



  const register = useCallback(async (data) => {

    try {

      const { user: apiUser, token } = await apiRegister(data);

      saveToken(token);

      const session = { id: apiUser.id, name: apiUser.name, email: apiUser.email };

      saveSession(session);

      setUser(session);

      loadUserHistory(session);

      setUserStats({ totalQuestions: 0 });

      showToast(`ثبت‌نام موفق! سلام ${apiUser.name}`);

      return apiUser;

    } catch (apiErr) {

      if (!isNetworkError(apiErr)) throw apiErr;

      const u = localRegister(data);

      const session = { id: u.id, name: u.name, email: u.email };

      setUser(session);

      loadUserHistory(session);

      showToast(`ثبت‌نام موفق! (حالت آفلاین)`);

      return u;

    }

  }, [loadUserHistory, showToast]);



  const logout = useCallback(() => {

    logoutUser();

    setUser(null);

    setActivePanel(null);

    loadUserHistory(null);

    refreshUsage();

    setUserStats(null);

    showToast('از حساب خارج شدید.');

  }, [loadUserHistory, refreshUsage, showToast]);



  const addToHistory = useCallback((item) => {

    if (settings.saveHistory) {

      setHistory(addHistoryItem(item, user?.id ?? null));

    }

  }, [settings.saveHistory, user]);



  const removeFromHistory = useCallback((id) => {

    setHistory(deleteHistoryItem(id, user?.id ?? null));

  }, [user]);



  const clearAllHistory = useCallback(() => {

    clearHistory(user?.id ?? null);

    setHistory([]);

  }, [user]);



  const sendContact = useCallback(async (msg) => {

    try {

      return await apiSendContact(msg);

    } catch (err) {

      if (!isNetworkError(err)) throw err;

      throw new Error('سرور در دسترس نیست. لطفاً بعداً تلاش کنید.');

    }

  }, []);



  const openPanel = useCallback((panelId) => setActivePanel(panelId), []);

  const closePanel = useCallback(() => setActivePanel(null), []);



  const plan = getPlanInfo(user);



  return (

    <AppContext.Provider

      value={{

        user,

        settings,

        history,

        activePanel,

        guestRemaining,

        plan,

        userStats,

        toast,

        authReady,

        updateSettings,

        login,

        register,

        logout,

        canAskQuestion,

        recordQuestion,

        addToHistory,

        removeFromHistory,

        clearAllHistory,

        sendContact,

        openPanel,

        closePanel,

        showToast,

        hideToast,

        refreshUserStats,

      }}

    >

      {children}

    </AppContext.Provider>

  );

}



export function useApp() {

  const ctx = useContext(AppContext);

  if (!ctx) throw new Error('useApp must be used within AppProvider');

  return ctx;

}



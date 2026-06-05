import { useState, useEffect, useCallback } from 'react';

export function useNotification() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  const updateState = useCallback((newPermission: NotificationPermission) => {
    setPermissionState(newPermission);
    if (newPermission === 'granted') {
      setIsUnlocked(true);
      localStorage.setItem('magrinha_sapeka_unlocked', 'true');
    } else {
      setIsUnlocked(false);
      localStorage.removeItem('magrinha_sapeka_unlocked');
    }
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      updateState(Notification.permission);
    }

    let permissionStatus: PermissionStatus | null = null;
    
    const checkPermission = async () => {
      try {
        if ('permissions' in navigator) {
          permissionStatus = await navigator.permissions.query({ name: 'notifications' });
          permissionStatus.onchange = () => {
            updateState(Notification.permission);
          };
        }
      } catch (e) {
        console.error("Permissions API not supported or error:", e);
      }
    };

    checkPermission();
    
    // Interval fallback to detect permission revocation if window loses focus or event fails
    const interval = setInterval(() => {
      if ('Notification' in window) {
        const currentPerm = Notification.permission;
        setPermissionState((prev) => {
          if (prev !== currentPerm) {
            updateState(currentPerm);
          }
          return currentPerm;
        });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [updateState]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert("Seu navegador não suporta notificações.");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      updateState(permission);
      
      if (permission === 'granted') {
        alert("Notificações ativadas com sucesso! Conteúdo liberado.");
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      return false;
    }
  }, [updateState]);

  return { isUnlocked, permissionState, requestPermission };
}

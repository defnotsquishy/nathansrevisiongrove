import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  cloudConfigured,
  accountError,
  type CloudUser,
  type Role,
} from '@/lib/cloud-config';
import type { CloudRuntime } from '@/lib/cloud-client';
type Cloud = {
  loading: boolean;
  user: CloudUser | null;
  role: Role;
  runtime: CloudRuntime | null;
  error: string;
};
const CloudContext = createContext<Cloud>({
  loading: cloudConfigured,
  user: null,
  role: 'member',
  runtime: null,
  error: '',
});
export function CloudProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<Cloud>({
    loading: cloudConfigured,
    user: null,
    role: 'member',
    runtime: null,
    error: '',
  });
  useEffect(() => {
    if (!cloudConfigured) return;
    let active = true,
      generation = 0;
    let unsubscribe: (() => void) | undefined;
    void import('@/lib/cloud-client')
      .then(({ runtime }) => {
        if (!active) return;
        unsubscribe = runtime.listen((user) => {
          const id = ++generation;
          setValue({
            loading: Boolean(user?.verified),
            user,
            role: 'member',
            runtime,
            error: '',
          });
          if (user?.verified)
            void runtime
              .profile()
              .then(() => runtime.role())
              .then((role) => {
                if (active && id === generation)
                  setValue({ loading: false, user, role, runtime, error: '' });
              })
              .catch((error) => {
                if (active && id === generation)
                  setValue({
                    loading: false,
                    user,
                    role: 'member',
                    runtime,
                    error: accountError(error),
                  });
              });
        });
      })
      .catch((error) => {
        if (active)
          setValue({
            loading: false,
            user: null,
            role: 'member',
            runtime: null,
            error: accountError(error),
          });
      });
    return () => {
      active = false;
      generation++;
      unsubscribe?.();
    };
  }, []);
  return (
    <CloudContext.Provider value={value}>{children}</CloudContext.Provider>
  );
}
export function useCloud() {
  return useContext(CloudContext);
}

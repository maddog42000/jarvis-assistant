import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingContextValue {
  isReady: boolean;
  hasCompletedOnboarding: boolean;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);
const ONBOARDING_KEY = 'jarvis_onboarding_completed';

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => setHasCompletedOnboarding(value === 'true'))
      .catch((error) => console.warn('Unable to load onboarding state:', error))
      .finally(() => setIsReady(true));
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompletedOnboarding(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    setCurrentStep(0);
    setHasCompletedOnboarding(false);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isReady,
        hasCompletedOnboarding,
        currentStep,
        setCurrentStep,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, ArrowRight, ChevronDown } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadow } from '@/constants/theme';
import { useData } from '@/context/DataContext';

interface CountryCode {
  code: string;
  flag: string;
  name: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+1', flag: '🇺🇸', name: 'US' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+91', flag: '🇮🇳', name: 'IN' },
  { code: '+61', flag: '🇦🇺', name: 'AU' },
  { code: '+81', flag: '🇯🇵', name: 'JP' },
  { code: '+49', flag: '🇩🇪', name: 'DE' },
  { code: '+33', flag: '🇫🇷', name: 'FR' },
  { code: '+86', flag: '🇨🇳', name: 'CN' },
  { code: '+52', flag: '🇲🇽', name: 'MX' },
  { code: '+55', flag: '🇧🇷', name: 'BR' },
];

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function stripPhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

export default function AuthScreen() {
  const { login, verifyOtp } = useData();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const formSlide = useRef(new Animated.Value(60)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();
  }, [logoScale, fadeAnim, slideAnim, formFade, formSlide]);

  const digits = stripPhone(phoneRaw);
  const isValid = digits.length === 10;

  const handlePhoneChange = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    setPhoneRaw(cleaned);
    if (error) setError('');
  }, [error]);

  const handleOtpChange = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    setOtpCode(cleaned);
    if (error) setError('');
  }, [error]);

  const handleContinuePhone = useCallback(async () => {
    if (!isValid) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setIsLoading(true);
    try {
      const fullNumber = `${selectedCountry.code}${digits}`;
      await login(fullNumber);
      setStep('otp');
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isValid, digits, selectedCountry.code, login]);

  const handleVerifyOtp = useCallback(async () => {
    if (otpCode.length < 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setIsLoading(true);
    try {
      const fullNumber = `${selectedCountry.code}${digits}`;
      await verifyOtp(fullNumber, otpCode);
    } catch (e: any) {
      setError(e.message || 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [otpCode, digits, selectedCountry.code, verifyOtp]);

  return (
    <View style={styles.background}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.topSection}>
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
              <View style={styles.logoInner}>
                <Image source={require('../assets/images/icon-transparent.png')} style={{ width: 80, height: 80 }} resizeMode="contain" />
              </View>
            </Animated.View>

            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <Text style={styles.appName}>VIP Health Recs</Text>
              <Text style={styles.tagline}>Your complete health dashboard</Text>
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.bottomSection,
              { opacity: formFade, transform: [{ translateY: formSlide }] },
            ]}
          >
            {step === 'phone' ? (
              <>
                <Text style={styles.loginTitle}>Sign in with your phone</Text>
                <Text style={styles.loginSubtitle}>
                  We'll send a verification code to confirm your identity
                </Text>

                <View style={styles.phoneRow}>
                  <Pressable
                    style={[
                      styles.countrySelector,
                      showCountryPicker && styles.countrySelectorActive,
                    ]}
                    onPress={() => setShowCountryPicker(!showCountryPicker)}
                  >
                    <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                    <ChevronDown size={14} color={colors.textSecondary} />
                  </Pressable>

                  <View
                    style={[
                      styles.phoneInputContainer,
                      inputFocused && styles.phoneInputFocused,
                      error ? styles.phoneInputError : null,
                    ]}
                  >
                    <Phone size={18} color={inputFocused ? colors.primary : colors.textTertiary} />
                    <TextInput
                      ref={inputRef}
                      style={styles.phoneInput}
                      placeholder="(555) 123-4567"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="phone-pad"
                      value={formatPhoneDisplay(phoneRaw)}
                      onChangeText={handlePhoneChange}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      maxLength={14}
                      testID="phone-input"
                    />
                  </View>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {showCountryPicker && (
                  <View style={styles.countryDropdown}>
                    {COUNTRY_CODES.map((c) => (
                      <Pressable
                        key={c.code}
                        style={[
                          styles.countryOption,
                          selectedCountry.code === c.code && styles.countryOptionActive,
                        ]}
                        onPress={() => {
                          setSelectedCountry(c);
                          setShowCountryPicker(false);
                        }}
                      >
                        <Text style={styles.countryOptionFlag}>{c.flag}</Text>
                        <Text style={styles.countryOptionName}>{c.name}</Text>
                        <Text style={styles.countryOptionCode}>{c.code}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                <Pressable
                  style={[
                    styles.continueButton,
                    !isValid && styles.continueButtonDisabled,
                  ]}
                  onPress={handleContinuePhone}
                  disabled={!isValid || isLoading}
                  testID="continue-button"
                >
                  {isLoading ? (
                    <Text style={styles.continueButtonText}>Sending code...</Text>
                  ) : (
                    <>
                      <Text style={styles.continueButtonText}>Continue</Text>
                      <ArrowRight size={18} color={colors.textInverse} />
                    </>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.loginTitle}>Enter verification code</Text>
                <Text style={styles.loginSubtitle}>
                  We sent a 6-digit code to {selectedCountry.code} {formatPhoneDisplay(phoneRaw)}
                </Text>

                <View style={[styles.phoneInputContainer, inputFocused && styles.phoneInputFocused, error ? styles.phoneInputError : null, { marginBottom: spacing.md }]}>
                  <TextInput
                    ref={inputRef}
                    style={[styles.phoneInput, { textAlign: 'center', fontSize: 24, letterSpacing: 8 }]}
                    placeholder="000000"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                    value={otpCode}
                    onChangeText={handleOtpChange}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    maxLength={6}
                    testID="otp-input"
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable onPress={() => setStep('phone')} style={{ marginBottom: spacing.sm, alignItems: 'center' }}>
                  <Text style={{ color: colors.primary, ...typography.callout, fontWeight: '600' as const }}>Change phone number</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.continueButton,
                    otpCode.length < 6 && styles.continueButtonDisabled,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={otpCode.length < 6 || isLoading}
                  testID="verify-button"
                >
                  {isLoading ? (
                    <Text style={styles.continueButtonText}>Verifying...</Text>
                  ) : (
                    <Text style={styles.continueButtonText}>Verify & Login</Text>
                  )}
                </Pressable>
              </>
            )}

            <Text style={styles.disclaimer}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  logoContainer: {
    marginBottom: spacing.xxl,
  },
  logoInner: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.textInverse,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  bottomSection: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  loginTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  loginSubtitle: {
    ...typography.callout,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    lineHeight: 20,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  countrySelectorActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryCode: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  phoneInputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  phoneInputError: {
    borderColor: colors.error,
  },
  phoneInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 14,
    fontSize: 17,
    letterSpacing: 0.3,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  countryDropdown: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadow.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  countryOptionActive: {
    backgroundColor: colors.primaryFaded,
  },
  countryOptionFlag: {
    fontSize: 18,
  },
  countryOptionName: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    fontWeight: '500' as const,
  },
  countryOptionCode: {
    ...typography.callout,
    color: colors.textSecondary,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 15,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    minHeight: 52,
  },
  continueButtonDisabled: {
    opacity: 0.45,
  },
  continueButtonText: {
    ...typography.headline,
    color: colors.textInverse,
  },
  disclaimer: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});

import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Linking,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Send,
  User,
  ChevronLeft,
  MessageSquare,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadow } from '@/constants/theme';
import { useData } from '@/context/DataContext';

// ─── Provider contacts ───────────────────────────────────────────────────────

const PROVIDERS = [
  { id: 'prov-2', name: 'Dr. Michael Torres', specialty: 'General Dentistry',    email: 'torres@sfdental.com',   avatar: 'MT' },
  { id: 'prov-4', name: 'Dr. Lisa Park',      specialty: 'Periodontics',         email: 'park@perio.com',        avatar: 'LP' },
  { id: 'prov-5', name: 'Dr. James Liu',      specialty: 'Oral Surgery',         email: 'liu@oralsurgery.com',   avatar: 'JL' },
  { id: 'prov-1', name: 'Dr. Sarah Chen',     specialty: 'Primary Care',         email: 'chen@sfmedical.com',    avatar: 'SC' },
  { id: 'prov-3', name: 'Dr. Emily Watson',   specialty: 'Cardiology',           email: 'watson@heartcare.com',  avatar: 'EW' },
];

const SUBJECT_TEMPLATES = [
  'General Question',
  'Appointment Follow-up',
  'Prescription Inquiry',
  'Test Results',
  'Referral Request',
  'Billing Question',
];

// ─── Build the email body ─────────────────────────────────────────────────────

function buildEmailBody(
  patientInfo: Record<string, string>,
  message: string,
  insurancePolicies: any[]
): string {
  const insurance = insurancePolicies?.[0];
  const lines = [
    message,
    '',
    '────────────────────────────',
    'PATIENT INFORMATION (Auto-filled)',
    '────────────────────────────',
    `Name:         ${patientInfo.firstName} ${patientInfo.lastName}`,
    `Date of Birth: ${patientInfo.dateOfBirth || 'On file'}`,
    `Phone:        ${patientInfo.cellPhone || patientInfo.homePhone || 'On file'}`,
    `Email:        ${patientInfo.email || 'On file'}`,
    `Address:      ${patientInfo.homeAddress ? `${patientInfo.homeAddress}, ${patientInfo.city}, ${patientInfo.state} ${patientInfo.zip}` : 'On file'}`,
  ];

  if (insurance) {
    lines.push('');
    lines.push('INSURANCE ON FILE');
    lines.push(`Provider:      ${insurance.provider}`);
    lines.push(`Policy #:      ${insurance.policyNumber}`);
    lines.push(`Group #:       ${insurance.groupNumber}`);
    lines.push(`Primary Holder:${insurance.primaryHolder}`);
  }

  lines.push('');
  lines.push(`Sent via VIP Health Recs · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);

  return lines.join('\n');
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function MessageProviderScreen() {
  const router = useRouter();
  const { healthHistories, insurancePolicies } = useData();

  const patientRaw = healthHistories?.[0]?.patientInfo as Record<string, string> | undefined;
  const patientInfo: Record<string, string> = patientRaw ?? {};
  const patientName = patientInfo.firstName
    ? `${patientInfo.firstName} ${patientInfo.lastName ?? ''}`.trim()
    : 'Patient';

  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [subject, setSubject] = useState(SUBJECT_TEMPLATES[0]);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const sendScale = useRef(new Animated.Value(1)).current;

  const handleSend = () => {
    if (!message.trim()) {
      Alert.alert('Write a message', 'Please type your message before sending.');
      return;
    }

    const body = buildEmailBody(patientInfo, message, insurancePolicies ?? []);
    const mailtoUrl =
      `mailto:${selectedProvider.email}` +
      `?subject=${encodeURIComponent(`[VIP Health Recs] ${subject} – ${patientName}`)}` +
      `&body=${encodeURIComponent(body)}`;

    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (!supported) {
          Alert.alert(
            'No Email App Found',
            `You can reach ${selectedProvider.name} directly at:\n${selectedProvider.email}`,
            [{ text: 'OK' }]
          );
          return;
        }
        return Linking.openURL(mailtoUrl);
      })
      .then(() => {
        setSent(true);
        Animated.sequence([
          Animated.spring(sendScale, { toValue: 1.08, friction: 6, useNativeDriver: true }),
          Animated.spring(sendScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();
      })
      .catch(() => {
        Alert.alert('Error', 'Could not open your email app. Please try again.');
      });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Message Provider</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <MessageSquare size={22} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Send a Message</Text>
            <Text style={styles.headerSubtitle}>
              Your patient info is auto-attached. Just write your message and tap Send.
            </Text>
          </View>
        </View>

        {/* ── To: Provider picker ─────────────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>To</Text>
          <Pressable
            id="provider-picker-toggle"
            style={styles.pickerRow}
            onPress={() => { setShowProviderPicker(v => !v); setShowSubjectPicker(false); }}
          >
            <View style={styles.providerAvatar}>
              <Text style={styles.providerAvatarText}>{selectedProvider.avatar}</Text>
            </View>
            <View style={styles.pickerInfo}>
              <Text style={styles.pickerPrimary}>{selectedProvider.name}</Text>
              <Text style={styles.pickerSecondary}>{selectedProvider.specialty}</Text>
            </View>
            {showProviderPicker
              ? <ChevronUp size={18} color={colors.textTertiary} />
              : <ChevronDown size={18} color={colors.textTertiary} />
            }
          </Pressable>

          {showProviderPicker && (
            <View style={styles.dropdownList}>
              {PROVIDERS.map(p => (
                <Pressable
                  key={p.id}
                  id={`provider-option-${p.id}`}
                  style={[
                    styles.dropdownItem,
                    selectedProvider.id === p.id && styles.dropdownItemSelected,
                  ]}
                  onPress={() => { setSelectedProvider(p); setShowProviderPicker(false); }}
                >
                  <View style={[
                    styles.providerAvatar,
                    styles.providerAvatarSm,
                    selectedProvider.id === p.id && { backgroundColor: `${colors.primary}20` },
                  ]}>
                    <Text style={[
                      styles.providerAvatarText,
                      selectedProvider.id === p.id && { color: colors.primary },
                    ]}>{p.avatar}</Text>
                  </View>
                  <View style={styles.pickerInfo}>
                    <Text style={[
                      styles.pickerPrimary,
                      selectedProvider.id === p.id && { color: colors.primary },
                    ]}>{p.name}</Text>
                    <Text style={styles.pickerSecondary}>{p.specialty}</Text>
                  </View>
                  {selectedProvider.id === p.id && (
                    <CheckCircle size={16} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ── Subject picker ──────────────────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Subject</Text>
          <Pressable
            id="subject-picker-toggle"
            style={styles.pickerRow}
            onPress={() => { setShowSubjectPicker(v => !v); setShowProviderPicker(false); }}
          >
            <Text style={styles.pickerPrimary}>{subject}</Text>
            {showSubjectPicker
              ? <ChevronUp size={18} color={colors.textTertiary} />
              : <ChevronDown size={18} color={colors.textTertiary} />
            }
          </Pressable>

          {showSubjectPicker && (
            <View style={styles.dropdownList}>
              {SUBJECT_TEMPLATES.map(s => (
                <Pressable
                  key={s}
                  id={`subject-option-${s.replace(/\s/g, '-')}`}
                  style={[
                    styles.dropdownItem,
                    subject === s && styles.dropdownItemSelected,
                  ]}
                  onPress={() => { setSubject(s); setShowSubjectPicker(false); }}
                >
                  <Text style={[
                    styles.pickerPrimary,
                    subject === s && { color: colors.primary, fontWeight: '600' },
                  ]}>{s}</Text>
                  {subject === s && <CheckCircle size={16} color={colors.primary} />}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ── Message box ─────────────────────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Your Message</Text>
          <TextInput
            id="message-input"
            style={styles.messageInput}
            value={message}
            onChangeText={(t) => { setMessage(t); setSent(false); }}
            placeholder={`Hi ${selectedProvider.name.split(' ')[0]},\n\nI wanted to ask about...`}
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={7}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{message.length} characters</Text>
        </View>

        {/* ── Auto-attached info preview ──────────────────────────────────── */}
        <View style={styles.autoInfoCard}>
          <View style={styles.autoInfoHeader}>
            <User size={14} color={colors.primary} />
            <Text style={styles.autoInfoTitle}>Auto-attached to your message</Text>
          </View>
          <View style={styles.autoInfoRows}>
            <AutoInfoRow label="Name" value={patientName} />
            <AutoInfoRow label="DOB" value={patientInfo.dateOfBirth || 'On file'} />
            <AutoInfoRow label="Phone" value={patientInfo.cellPhone || patientInfo.homePhone || 'On file'} />
            <AutoInfoRow label="Email" value={patientInfo.email || 'On file'} />
            {(insurancePolicies ?? []).length > 0 && (
              <AutoInfoRow label="Insurance" value={(insurancePolicies as any[])[0]?.provider || 'On file'} />
            )}
          </View>
        </View>

        {/* ── Send button ─────────────────────────────────────────────────── */}
        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <Pressable
            id="send-message-button"
            style={[styles.sendBtn, sent && styles.sendBtnSent]}
            onPressIn={() =>
              Animated.spring(sendScale, { toValue: 0.96, friction: 8, useNativeDriver: true }).start()
            }
            onPressOut={() =>
              Animated.spring(sendScale, { toValue: 1, friction: 8, useNativeDriver: true }).start()
            }
            onPress={handleSend}
          >
            {sent ? (
              <>
                <CheckCircle size={20} color="#fff" />
                <Text style={styles.sendBtnText}>Email App Opened — Hit Send!</Text>
              </>
            ) : (
              <>
                <Send size={20} color="#fff" />
                <Text style={styles.sendBtnText}>Send Message</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        <Text style={styles.disclaimer}>
          Tapping Send will open your email app with everything pre-filled.
          Just hit send — your patient info is already attached.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

// ─── Helper sub-component ─────────────────────────────────────────────────────

function AutoInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.autoInfoRow}>
      <Text style={styles.autoInfoLabel}>{label}</Text>
      <Text style={styles.autoInfoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { ...typography.callout, color: colors.primary, fontWeight: '600' as const },

  // Header card
  headerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.primaryFaded,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  headerText: { flex: 1 },
  headerTitle: {
    ...typography.headline,
    color: colors.primary,
    marginBottom: 3,
  },
  headerSubtitle: {
    ...typography.callout,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Fields
  field: { marginBottom: spacing.xxl },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },

  // Picker row
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  pickerInfo: { flex: 1 },
  pickerPrimary: {
    ...typography.callout,
    color: colors.textPrimary,
    fontWeight: '600' as const,
  },
  pickerSecondary: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // Provider avatar
  providerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerAvatarSm: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  providerAvatarText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.primary,
  },

  // Dropdown
  dropdownList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginTop: spacing.sm,
    overflow: 'hidden',
    ...shadow.md,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primaryFaded,
  },

  // Message input
  messageInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 160,
  },
  charCount: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  // Auto-attached info
  autoInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.xxl,
    overflow: 'hidden',
  },
  autoInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primaryFaded,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.primary}20`,
  },
  autoInfoTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  autoInfoRows: {},
  autoInfoRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  autoInfoLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    width: 70,
    fontWeight: '600' as const,
  },
  autoInfoValue: {
    ...typography.callout,
    color: colors.textPrimary,
    flex: 1,
  },

  // Send button
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    ...shadow.lg,
  },
  sendBtnSent: {
    backgroundColor: colors.success,
  },
  sendBtnText: {
    ...typography.headline,
    color: '#fff',
  },

  // Disclaimer
  disclaimer: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
});

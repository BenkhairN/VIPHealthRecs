import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Bell,
  CheckCircle,
  Clock,
  Coffee,
  Sun,
  Moon,
  Utensils,
  Droplets,
  ChevronUp,
  ChevronDown,
  Pencil,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadow } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Reminder = {
  id: string;
  label: string;
  description: string;
  hour: number;   // 24-hour
  minute: number;
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
  iconBg: string;
  enabled: boolean;
  category: 'brush' | 'floss' | 'rinse';
  editable?: boolean; // only morning & afternoon brush
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(hour: number, minute: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

// ─── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_REMINDERS: Reminder[] = [
  // ── Brushing ──────────────────────────────────────────────────────────────
  {
    id: 'brush-morning',
    label: 'Morning Brush',
    description: 'Brush for 2 minutes after waking up',
    hour: 7, minute: 30,
    icon: Sun,
    iconColor: '#F59E0B',
    iconBg: '#FFFBEB',
    enabled: true,
    category: 'brush',
    editable: true,
  },
  {
    id: 'brush-afternoon',
    label: 'Afternoon Brush',
    description: 'Quick brush after lunch',
    hour: 12, minute: 30,
    icon: Coffee,
    iconColor: '#0EA5E9',
    iconBg: '#F0F9FF',
    enabled: true,
    category: 'brush',
    editable: true,
  },
  {
    id: 'brush-after-breakfast',
    label: 'After Breakfast',
    description: 'Brush after your morning meal',
    hour: 8, minute: 15,
    icon: Utensils,
    iconColor: '#10B981',
    iconBg: '#ECFDF5',
    enabled: true,
    category: 'brush',
  },
  {
    id: 'brush-after-dinner',
    label: 'After Dinner',
    description: 'Brush after your evening meal',
    hour: 19, minute: 0,
    icon: Utensils,
    iconColor: '#8B5CF6',
    iconBg: '#F5F3FF',
    enabled: true,
    category: 'brush',
  },
  {
    id: 'brush-bedtime',
    label: 'Bedtime Brush',
    description: 'Final brush before bed — most important!',
    hour: 22, minute: 0,
    icon: Moon,
    iconColor: '#6366F1',
    iconBg: '#EEF2FF',
    enabled: true,
    category: 'brush',
  },

  // ── Flossing ─────────────────────────────────────────────────────────────
  {
    id: 'floss-morning',
    label: 'Morning Floss',
    description: 'Floss between every tooth after brushing',
    hour: 7, minute: 35,
    icon: Sun,
    iconColor: '#F59E0B',
    iconBg: '#FFFBEB',
    enabled: true,
    category: 'floss',
  },
  {
    id: 'floss-bedtime',
    label: 'Bedtime Floss',
    description: 'Floss before your bedtime brush',
    hour: 21, minute: 55,
    icon: Moon,
    iconColor: '#6366F1',
    iconBg: '#EEF2FF',
    enabled: true,
    category: 'floss',
  },
  {
    id: 'floss-after-dinner',
    label: 'After Dinner Floss',
    description: 'Floss after your largest meal',
    hour: 18, minute: 55,
    icon: Utensils,
    iconColor: '#8B5CF6',
    iconBg: '#F5F3FF',
    enabled: false,
    category: 'floss',
  },

  // ── Rinse ─────────────────────────────────────────────────────────────────
  {
    id: 'rinse-morning',
    label: 'Mouthwash — Morning',
    description: 'Antibacterial rinse after morning brush',
    hour: 7, minute: 40,
    icon: Droplets,
    iconColor: '#0EA5E9',
    iconBg: '#F0F9FF',
    enabled: false,
    category: 'rinse',
  },
  {
    id: 'rinse-bedtime',
    label: 'Mouthwash — Bedtime',
    description: 'Fluoride rinse as the last step at night',
    hour: 22, minute: 5,
    icon: Droplets,
    iconColor: '#6366F1',
    iconBg: '#EEF2FF',
    enabled: false,
    category: 'rinse',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  brush: '🪥  Brushing',
  floss: '🦷  Flossing',
  rinse: '💧  Mouthwash',
};

const MINUTE_STEP = 5;

// ─── Screen ───────────────────────────────────────────────────────────────────

const REMINDERS_KEY = '@vip_reminders';

export default function RemindersScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>(DEFAULT_REMINDERS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Load saved reminders on mount
  useEffect(() => {
    AsyncStorage.getItem(REMINDERS_KEY)
      .then(data => {
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            // Merge saved enabled/hour/minute back into DEFAULT_REMINDERS
            // (preserves icon refs which can't be serialized)
            setReminders(DEFAULT_REMINDERS.map(def => {
              const saved = parsed.find((s: any) => s.id === def.id);
              return saved ? { ...def, enabled: saved.enabled, hour: saved.hour, minute: saved.minute } : def;
            }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const toggleReminder = (id: string) => {
    setSaved(false);
    setReminders(prev => prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const updateTime = (id: string, field: 'hour' | 'minute', delta: number) => {
    setSaved(false);
    setReminders(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        if (field === 'hour') {
          const newHour = (r.hour + delta + 24) % 24;
          return { ...r, hour: newHour };
        } else {
          // snap to nearest MINUTE_STEP
          const total = r.minute + delta;
          const newMinute = ((total % 60) + 60) % 60;
          return { ...r, minute: newMinute };
        }
      })
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const enabledCount = reminders.filter(r => r.enabled).length;

  const handleSave = () => {
    // Persist only serializable fields (no icon refs)
    const toSave = reminders.map(({ id, enabled, hour, minute }) => ({ id, enabled, hour, minute }));
    AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(toSave)).catch(() => {});
    setSaved(true);
    setExpandedId(null);
    Alert.alert(
      'Reminders Saved',
      `${enabledCount} reminder${enabledCount !== 1 ? 's' : ''} are now active.`,
      [{ text: 'Great!', onPress: () => router.back() }]
    );
  };

  const categories = ['brush', 'floss', 'rinse'] as const;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Set Reminders</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Intro banner ─────────────────────────────────────────────── */}
        <View style={styles.introBanner}>
          <View style={styles.introIconWrap}>
            <Bell size={24} color="#F97316" />
          </View>
          <View style={styles.introText}>
            <Text style={styles.introTitle}>Daily Oral Health Reminders</Text>
            <Text style={styles.introSubtitle}>
              Toggle reminders on/off. Tap the ✏️ pencil on Morning or Afternoon Brush to set your preferred time.
            </Text>
          </View>
        </View>

        {/* ── Stats strip ──────────────────────────────────────────────── */}
        <View style={styles.statsStrip}>
          <StatPill value={`${enabledCount}`} label="Active" color={colors.success} />
          <StatPill value={`${reminders.length - enabledCount}`} label="Paused" color={colors.textTertiary} />
          <StatPill value={`${reminders.length}`} label="Total" color={colors.primary} />
        </View>

        {/* ── Reminder groups ───────────────────────────────────────────── */}
        {categories.map(cat => {
          const group = reminders.filter(r => r.category === cat);
          const activeInGroup = group.filter(r => r.enabled).length;
          return (
            <View key={cat} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{CATEGORY_LABELS[cat]}</Text>
                <Text style={styles.groupCount}>{activeInGroup}/{group.length} on</Text>
              </View>
              <View style={styles.groupCards}>
                {group.map((reminder, idx) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    isLast={idx === group.length - 1}
                    isExpanded={expandedId === reminder.id}
                    onToggle={() => toggleReminder(reminder.id)}
                    onToggleExpand={() => toggleExpand(reminder.id)}
                    onUpdateTime={(field, delta) => updateTime(reminder.id, field, delta)}
                  />
                ))}
              </View>
            </View>
          );
        })}

        {/* ── Dental tip ───────────────────────────────────────────────── */}
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <View style={styles.tipBody}>
            <Text style={styles.tipTitle}>Pro Tip from Your Dentist</Text>
            <Text style={styles.tipText}>
              Brushing after every meal reduces cavities by up to 40%.
              Flossing at bedtime removes bacteria your brush can't reach.
            </Text>
          </View>
        </View>

        {/* ── Save button ──────────────────────────────────────────────── */}
        <Pressable
          id="save-reminders-button"
          style={[styles.saveBtn, saved && styles.saveBtnSaved]}
          onPress={handleSave}
        >
          {saved ? <CheckCircle size={20} color="#fff" /> : <Bell size={20} color="#fff" />}
          <Text style={styles.saveBtnText}>
            {saved ? 'Reminders Saved!' : `Save ${enabledCount} Reminder${enabledCount !== 1 ? 's' : ''}`}
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

// ─── ReminderCard ─────────────────────────────────────────────────────────────

function ReminderCard({
  reminder,
  isLast,
  isExpanded,
  onToggle,
  onToggleExpand,
  onUpdateTime,
}: {
  reminder: Reminder;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleExpand: () => void;
  onUpdateTime: (field: 'hour' | 'minute', delta: number) => void;
}) {
  const Icon = reminder.icon;
  const timeStr = formatTime(reminder.hour, reminder.minute);

  return (
    <View style={[styles.cardWrap, isLast && styles.cardWrapLast]}>
      {/* Main row */}
      <View style={styles.card}>
        <View style={[styles.cardIconWrap, { backgroundColor: reminder.iconBg }]}>
          <Icon size={20} color={reminder.iconColor} />
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.cardLabel, !reminder.enabled && styles.cardLabelOff]}>
            {reminder.label}
          </Text>
          <Text style={styles.cardDesc}>{reminder.description}</Text>

          {/* Time row — tap pencil to edit if editable */}
          <Pressable
            style={styles.cardTimeRow}
            onPress={reminder.editable ? onToggleExpand : undefined}
            hitSlop={8}
          >
            <Clock size={12} color={reminder.enabled ? colors.primary : colors.textTertiary} />
            <Text style={[styles.cardTime, !reminder.enabled && styles.cardTimeOff]}>
              {timeStr}
            </Text>
            {reminder.editable && (
              <View style={styles.editBadge}>
                <Pencil size={10} color={isExpanded ? colors.primary : colors.textTertiary} />
                <Text style={[styles.editBadgeText, isExpanded && { color: colors.primary }]}>
                  {isExpanded ? 'Done' : 'Edit'}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <Switch
          value={reminder.enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.borderLight, true: `${colors.primary}60` }}
          thumbColor={reminder.enabled ? colors.primary : colors.textTertiary}
          ios_backgroundColor={colors.borderLight}
        />
      </View>

      {/* ── Inline time picker (editable only) ─────────────────────── */}
      {reminder.editable && isExpanded && (
        <View style={styles.timePicker}>
          <Text style={styles.timePickerLabel}>Set reminder time</Text>

          <View style={styles.timePickerControls}>
            {/* Hour stepper */}
            <View style={styles.stepper}>
              <Text style={styles.stepperUnit}>Hour</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => onUpdateTime('hour', 1)}
                hitSlop={8}
              >
                <ChevronUp size={20} color={colors.primary} />
              </Pressable>
              <View style={styles.stepperValueBox}>
                <Text style={styles.stepperValue}>
                  {reminder.hour % 12 === 0 ? 12 : reminder.hour % 12}
                </Text>
              </View>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => onUpdateTime('hour', -1)}
                hitSlop={8}
              >
                <ChevronDown size={20} color={colors.primary} />
              </Pressable>
            </View>

            <Text style={styles.timeSeparator}>:</Text>

            {/* Minute stepper */}
            <View style={styles.stepper}>
              <Text style={styles.stepperUnit}>Min</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => onUpdateTime('minute', MINUTE_STEP)}
                hitSlop={8}
              >
                <ChevronUp size={20} color={colors.primary} />
              </Pressable>
              <View style={styles.stepperValueBox}>
                <Text style={styles.stepperValue}>
                  {reminder.minute.toString().padStart(2, '0')}
                </Text>
              </View>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => onUpdateTime('minute', -MINUTE_STEP)}
                hitSlop={8}
              >
                <ChevronDown size={20} color={colors.primary} />
              </Pressable>
            </View>

            <Text style={styles.timeSeparator}> </Text>

            {/* AM/PM toggle */}
            <View style={styles.stepper}>
              <Text style={styles.stepperUnit}>AM/PM</Text>
              <View style={{ height: 28 }} />
              <Pressable
                style={[
                  styles.ampmBtn,
                  reminder.hour < 12 && styles.ampmBtnActive,
                ]}
                onPress={() => {
                  if (reminder.hour >= 12) onUpdateTime('hour', -12);
                }}
              >
                <Text style={[styles.ampmText, reminder.hour < 12 && styles.ampmTextActive]}>AM</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.ampmBtn,
                  reminder.hour >= 12 && styles.ampmBtnActive,
                ]}
                onPress={() => {
                  if (reminder.hour < 12) onUpdateTime('hour', 12);
                }}
              >
                <Text style={[styles.ampmText, reminder.hour >= 12 && styles.ampmTextActive]}>PM</Text>
              </Pressable>
            </View>
          </View>

          {/* Preview */}
          <View style={styles.timePreview}>
            <Clock size={14} color={colors.primary} />
            <Text style={styles.timePreviewText}>Reminder set for {timeStr}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── StatPill ─────────────────────────────────────────────────────────────────

function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },

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
  headerTitle: { ...typography.headline, color: colors.textPrimary },

  introBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: '#FFF7ED',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  introIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    ...shadow.sm,
  },
  introText: { flex: 1 },
  introTitle: { ...typography.headline, color: '#C2410C', marginBottom: 4 },
  introSubtitle: { ...typography.callout, color: '#92400E', lineHeight: 20 },

  statsStrip: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl },
  statPill: {
    flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight,
  },
  statValue: { ...typography.title3, fontWeight: '700' as const },
  statLabel: { ...typography.small, color: colors.textTertiary, marginTop: 2 },

  group: { marginBottom: spacing.xxl },
  groupHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  groupTitle: { ...typography.headline, color: colors.textPrimary },
  groupCount: { ...typography.caption, color: colors.textTertiary, fontWeight: '500' as const },
  groupCards: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },

  cardWrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  cardWrapLast: { borderBottomWidth: 0 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardLabel: { ...typography.callout, color: colors.textPrimary, fontWeight: '600' as const },
  cardLabelOff: { color: colors.textTertiary },
  cardDesc: { ...typography.small, color: colors.textSecondary, marginTop: 1 },
  cardTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  cardTime: { ...typography.small, color: colors.primary, fontWeight: '600' as const },
  cardTimeOff: { color: colors.textTertiary },

  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryFaded,
    borderRadius: borderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 4,
  },
  editBadgeText: {
    ...typography.small,
    color: colors.textTertiary,
    fontWeight: '600' as const,
  },

  // ── Inline time picker ──────────────────────────────────────────────────────
  timePicker: {
    backgroundColor: colors.primaryFaded,
    borderTopWidth: 1,
    borderTopColor: `${colors.primary}20`,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  timePickerLabel: {
    ...typography.caption,
    color: colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    fontWeight: '600' as const,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  timePickerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stepper: {
    alignItems: 'center',
    gap: 4,
  },
  stepperUnit: {
    ...typography.small,
    color: colors.textTertiary,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  stepperBtn: {
    width: 44, height: 36,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperValueBox: {
    width: 64, height: 52,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadow.sm,
  },
  stepperValue: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.primary,
    marginTop: 32,
  },
  ampmBtn: {
    width: 52, height: 36,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  ampmBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ampmText: {
    ...typography.callout,
    color: colors.textTertiary,
    fontWeight: '700' as const,
  },
  ampmTextActive: { color: '#fff' },

  timePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  timePreviewText: {
    ...typography.callout,
    color: colors.primary,
    fontWeight: '600' as const,
  },

  // Tip
  tipCard: {
    flexDirection: 'row', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.borderLight,
    padding: spacing.lg, marginBottom: spacing.xxl,
  },
  tipEmoji: { fontSize: 22 },
  tipBody: { flex: 1 },
  tipTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: 4 },
  tipText: { ...typography.callout, color: colors.textSecondary, lineHeight: 20 },

  // Save
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: '#F97316',
    borderRadius: borderRadius.lg, paddingVertical: 16,
    ...shadow.lg,
  },
  saveBtnSaved: { backgroundColor: colors.success },
  saveBtnText: { ...typography.headline, color: '#fff' },
});

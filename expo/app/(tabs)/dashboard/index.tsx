import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, RefreshControl, Pressable, Image, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell, Calendar, Sparkles, TrendingUp, MessageSquare, Upload,
  FileText, Pill, RefreshCw, ClipboardList, Clock, Shield, Phone,
  AlertTriangle, Info, CheckCircle2, Eye, Download, ArrowLeftRight,
  MapPin, Plus, BookOpen, PlayCircle, BookMarked,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadow } from '@/constants/theme';
import Card from '@/components/Card';
import { useData } from '@/context/DataContext';
import GamificationPanel from '@/components/dashboard/GamificationPanel';
import DentalChartView from '@/components/dashboard/DentalChartView';
import NotificationsPanel from '@/components/NotificationsPanel';
import {
  quickActions,
  insuranceData,
  insights,
  dashboardAppointments,
  dashboardRecords,
  dashboardReferrals,
  educationalResources,
  type QuickAction,
  type InsuranceInfo,
  type InsightCard,
  type DashboardReferral,
} from '@/mocks/dashboardData';


const AVATAR_URL = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/62ucvr22l2ze5sr60nnf9';

const iconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Calendar, MessageSquare, Upload, FileText, Pill, RefreshCw, ClipboardList, Clock,
};

const resourceIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Article: FileText,
  Video: PlayCircle,
  Guide: BookMarked,
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good Morning';
  if (h >= 12 && h < 17) return 'Good Afternoon';
  if (h >= 17 && h < 21) return 'Good Evening';
  return 'Good Night';
}

export default function DashboardScreen() {
  const { 
    gamificationProfile, appointments, records, medications, 
    healthHistories, isSeeded, isAuthenticated, getProvider,
    insurancePolicies, unreadCount,
  } = useData();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [recordsTab, setRecordsTab] = useState<'medical' | 'dental'>('medical');
  const [referralTab, setReferralTab] = useState<'active' | 'history'>('active');
  const [notifVisible, setNotifVisible] = useState(false);

  const firstName = healthHistories?.[0]?.patientInfo?.firstName || 'there';
  const avatarUri = gamificationProfile?.avatar_url || AVATAR_URL;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const activeReferrals = dashboardReferrals.filter(r => r.status !== 'Completed');
  const historyReferrals = dashboardReferrals.filter(r => r.status === 'Completed');
  const displayedReferrals = referralTab === 'active' ? activeReferrals : historyReferrals;

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={s.safeTop}>
        <View style={s.header}>
          <View style={s.logoRow}>
            <Image 
              source={require('../../../assets/images/icon-transparent.png')} 
              style={s.logoIcon} 
              resizeMode="contain" 
            />
            <Text style={s.logoText}>
              <Text style={s.logoBold}>VIP</Text>
              <Text style={s.logoLight}>health</Text>
              <Text style={s.logoBold}>recs</Text>
            </Text>
          </View>
          <View style={s.headerRight}>
            <Pressable style={s.bellBtn} hitSlop={8} onPress={() => setNotifVisible(true)}>
              <Bell size={22} color={colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={s.bellBadge}>
                  <Text style={s.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => router.push('/profile')}>
              <Image source={{ uri: avatarUri }} style={s.headerAvatar} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <NotificationsPanel visible={notifVisible} onClose={() => setNotifVisible(false)} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Welcome Card */}
        <Card style={s.welcomeCard} variant="elevated">
          <View style={s.welcomeTitleRow}>
            <Sparkles size={20} color={colors.primary} />
            <Text style={s.welcomeTitle}>{getGreeting()} {firstName}</Text>
          </View>
          <Text style={s.welcomeSubtitle}>Welcome back to your integrated health dashboard</Text>
          <View style={s.welcomeStatsRow}>
            <View style={s.welcomeStat}>
              <View style={[s.welcomeStatIcon, { backgroundColor: colors.primaryFaded }]}>
                <Calendar size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={s.welcomeStatValue}>2</Text>
                <Text style={s.welcomeStatLabel}>Upcoming{'\n'}Appointments</Text>
              </View>
            </View>
            <View style={s.welcomeStat}>
              <View style={[s.welcomeStatIcon, { backgroundColor: colors.primaryFaded }]}>
                <TrendingUp size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={s.welcomeStatValue}>5 days</Text>
                <Text style={s.welcomeStatLabel}>Until Next{'\n'}Visit</Text>
              </View>
            </View>
          </View>
          <View style={s.reminderBox}>
            <Text style={s.reminderBold}>Your dental cleaning is coming up!</Text>
            <Text style={s.reminderText}>
              Remember, good oral health contributes to your overall wellness. Keep up with your daily brushing and flossing routine.
            </Text>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={s.actionsGrid}>
          {quickActions.map((action: QuickAction) => {
            const Icon = iconMap[action.icon] || Calendar;
            return (
              <Pressable 
                key={action.id} 
                style={[s.actionItem, { backgroundColor: action.bgColor }]}
                onPress={() => {
                  if (action.id === '1') {
                    router.push('/(tabs)/appointments/create');
                  } else if (action.id === '2') {
                    router.push('/message-provider');
                  } else if (action.id === '3') {
                    router.push('/upload');
                  } else if (action.id === '4') {
                    router.push('/refills');
                  } else if (action.id === '5') {
                    router.navigate('/medications');
                  } else if (action.id === '6') {
                    router.push('/refills');
                  } else if (action.id === '7') {
                    router.push('/rx-history');
                  } else if (action.id === '8') {
                    router.push('/reminders');
                  }
                }}
              >
                <Icon size={28} color={action.color} />
                <Text style={[s.actionLabel, { color: action.color }]}>{action.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Gamification */}
        <GamificationPanel />

        {/* Insurance Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.insuranceScroll}
          style={s.insuranceContainer}
        >
          {insurancePolicies?.length === 0 ? (
            <Pressable style={[s.insuranceCard, { justifyContent: 'center', alignItems: 'center', minHeight: 180 }]} onPress={() => router.push('/upload')}>
              <Shield size={40} color={colors.textTertiary} style={{ marginBottom: spacing.md }} />
              <Text style={{ ...typography.headline, color: colors.textSecondary, marginBottom: 8 }}>No Insurance Found</Text>
              <Text style={{ ...typography.body, color: colors.textTertiary, textAlign: 'center' }}>Upload your insurance card to instantly verify your live eligibility and financial limits via Payer APIs!</Text>
            </Pressable>
          ) : (
            insurancePolicies?.map((ins: any) => (
            <View key={ins.type} style={s.insuranceCard}>
              <View style={s.insuranceHeader}>
                <View style={s.insuranceIconBox}>
                  <Shield size={24} color={colors.textInverse} />
                </View>
                <View style={s.insuranceTitleCol}>
                  <Text style={s.insuranceType}>
                    {ins.type === 'dental' ? 'Dental' : 'Medical'} Insurance
                  </Text>
                </View>
                {ins.active && (
                  <View style={s.activeBadge}>
                    <CheckCircle2 size={12} color="#22C55E" />
                    <Text style={s.activeText}>Active</Text>
                  </View>
                )}
              </View>

              <View style={s.insuranceProviderBox}>
                <Text style={s.insuranceProviderLabel}>Insurance Provider</Text>
                <Text style={s.insuranceProviderName}>{ins.provider}</Text>
              </View>

              <View style={s.insuranceInfoRow}>
                <View style={s.insuranceInfoCol}>
                  <Text style={s.insuranceInfoLabel}>Policy Number</Text>
                  <Text style={s.insuranceInfoValue}>{ins.policyNumber}</Text>
                </View>
                <View style={s.insuranceInfoCol}>
                  <Text style={s.insuranceInfoLabel}>Group Number</Text>
                  <Text style={s.insuranceInfoValue}>{ins.groupNumber}</Text>
                </View>
              </View>

              <View style={s.insuranceHolderBox}>
                <View style={s.insuranceHolderRow}>
                  <Text style={s.insuranceHolderLabel}>Primary Holder</Text>
                  <Text style={s.insuranceHolderValue}>{ins.primaryHolder}</Text>
                </View>
                <View style={s.insuranceHolderRow}>
                  <Text style={s.insuranceHolderLabel}>Dependents</Text>
                  <Text style={s.insuranceHolderValue}>{ins.dependents}</Text>
                </View>
                <View style={s.insuranceHolderRow}>
                  <Text style={s.insuranceHolderLabel}>Coverage Start</Text>
                  <Text style={s.insuranceHolderValue}>{ins.coverageStart}</Text>
                </View>
              </View>

              {ins.lines.map((line: any, i: number) => (
                <View key={i} style={s.insuranceLine}>
                  <Text style={s.insuranceLineLabel}>{line.label}</Text>
                  <Text style={[s.insuranceLineValue, line.highlight && { color: colors.primary }]}>{line.value}</Text>
                </View>
              ))}

              <View style={s.insuranceServiceRow}>
                <Phone size={14} color={colors.primary} />
                <Text style={s.insuranceServiceLabel}>Customer Service</Text>
              </View>
              <Text style={s.insuranceServiceNumber}>{ins.customerService}</Text>

              <Pressable style={s.insurancePortalBtn}>
                <Text style={s.insurancePortalText}>{ins.portalLabel}</Text>
              </Pressable>
            </View>
            ))
          )}
        </ScrollView>

        {/* Medical-Dental Insights */}
        <Card style={s.sectionCard}>
          <View style={s.sectionHeaderRow}>
            <View style={s.sectionHeaderLeft}>
              <TrendingUp size={18} color={colors.primary} />
              <Text style={s.sectionHeaderTitle}>Medical-Dental Integration Insights</Text>
            </View>
            <Pressable>
              <Text style={s.viewAllText}>View All</Text>
            </Pressable>
          </View>
          {insights.map((insight: InsightCard) => {
            const insightColor = insight.type === 'warning' ? '#EF4444' : insight.type === 'info' ? colors.textPrimary : '#22C55E';
            const insightBg = insight.type === 'warning' ? '#FEF2F2' : insight.type === 'info' ? colors.surfaceSecondary : '#F0FFF4';
            const InsightIcon = insight.type === 'warning' ? AlertTriangle : insight.type === 'info' ? Info : CheckCircle2;
            return (
              <View key={insight.id} style={[s.insightCard, { backgroundColor: insightBg }]}>
                <View style={s.insightTitleRow}>
                  <InsightIcon size={16} color={insightColor} />
                  <Text style={[s.insightTitle, { color: insightColor }]}>{insight.title}</Text>
                </View>
                <Text style={[s.insightDesc, insight.type === 'warning' && { color: insightColor }]}>
                  {insight.description}
                </Text>
                <Pressable>
                  <Text style={s.insightAction}>{insight.actionLabel}</Text>
                </Pressable>
              </View>
            );
          })}
        </Card>

        {/* Upcoming Appointments */}
        <Card style={s.sectionCard}>
          <View style={s.sectionHeaderRow}>
            <View style={s.sectionHeaderLeft}>
              <Calendar size={18} color={colors.primary} />
              <Text style={s.sectionHeaderTitle}>Upcoming Appointments</Text>
            </View>
            <Pressable style={s.scheduleBtn}>
              <Text style={s.scheduleBtnText}>Schedule New</Text>
            </Pressable>
          </View>
          {dashboardAppointments.map(apt => (
            <View key={apt.id} style={s.apptCard}>
              <View style={s.apptRow}>
                <View style={[s.apptIconBox, { backgroundColor: apt.bgColor }]}>
                  <Calendar size={20} color={apt.iconColor} />
                </View>
                <View style={s.apptContent}>
                  <View style={s.apptCatRow}>
                    <View style={s.catBadge}>
                      <Text style={s.catBadgeText}>{apt.category}</Text>
                    </View>
                    <Pressable><Text style={s.detailsLink}>Details</Text></Pressable>
                  </View>
                  <Text style={s.apptTitle}>{apt.title}</Text>
                  <Text style={s.apptProvider}>{apt.provider}</Text>
                  <View style={s.apptMetaRow}>
                    <Clock size={12} color={colors.textTertiary} />
                    <Text style={s.apptMetaText}>{apt.date}</Text>
                  </View>
                  <View style={s.apptMetaRow}>
                    <MapPin size={12} color={colors.textTertiary} />
                    <Text style={s.apptMetaText}>{apt.location}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </Card>

        {/* Health Records */}
        <Card style={s.sectionCard}>
          <View style={s.sectionHeaderLeft}>
            <FileText size={18} color={colors.primary} />
            <Text style={s.sectionHeaderTitle}>Health Records</Text>
          </View>
          <View style={s.tabRow}>
            <Pressable
              style={[s.tabItem, recordsTab === 'medical' && s.tabItemActive]}
              onPress={() => setRecordsTab('medical')}
            >
              <Text style={[s.tabItemText, recordsTab === 'medical' && s.tabItemTextActive]}>Medical Records</Text>
            </Pressable>
            <Pressable
              style={[s.tabItem, recordsTab === 'dental' && s.tabItemActive]}
              onPress={() => setRecordsTab('dental')}
            >
              <Text style={[s.tabItemText, recordsTab === 'dental' && s.tabItemTextActive]}>Dental Records</Text>
            </Pressable>
          </View>
          {dashboardRecords.map(rec => (
            <View key={rec.id} style={s.recordItem}>
              <View style={s.recordIconBox}>
                <FileText size={18} color={colors.primary} />
              </View>
              <View style={s.recordInfo}>
                <Text style={s.recordTitle}>{rec.title}</Text>
                <Text style={s.recordMeta}>{rec.date} · {rec.provider}</Text>
              </View>
              <Pressable style={s.recordAction}><Eye size={18} color={colors.textTertiary} /></Pressable>
              <Pressable style={s.recordAction}><Download size={18} color={colors.textTertiary} /></Pressable>
            </View>
          ))}
        </Card>

        {/* Referral Management */}
        <Card style={s.sectionCard}>
          <View style={s.sectionHeaderRow}>
            <View style={s.sectionHeaderLeft}>
              <ArrowLeftRight size={18} color={colors.primary} />
              <Text style={s.sectionHeaderTitle}>Referral Management</Text>
            </View>
            <Pressable style={s.newRefBtn}>
              <Plus size={14} color={colors.textInverse} />
              <Text style={s.newRefBtnText}>New Referral</Text>
            </Pressable>
          </View>
          <View style={s.tabRow}>
            <Pressable
              style={[s.tabItem, referralTab === 'active' && s.tabItemActive]}
              onPress={() => setReferralTab('active')}
            >
              <Text style={[s.tabItemText, referralTab === 'active' && s.tabItemTextActive]}>Active Referrals</Text>
            </Pressable>
            <Pressable
              style={[s.tabItem, referralTab === 'history' && s.tabItemActive]}
              onPress={() => setReferralTab('history')}
            >
              <Text style={[s.tabItemText, referralTab === 'history' && s.tabItemTextActive]}>Referral History</Text>
            </Pressable>
          </View>
          {displayedReferrals.map((ref: DashboardReferral) => (
            <View key={ref.id} style={s.refCard}>
              <View style={s.refHeaderRow}>
                <Text style={s.refNumber}>{ref.refNumber}</Text>
                <View style={[s.refStatusBadge, { backgroundColor: ref.statusColor + '20' }]}>
                  <CheckCircle2 size={12} color={ref.statusColor} />
                  <Text style={[s.refStatusText, { color: ref.statusColor }]}>{ref.status}</Text>
                </View>
                <View style={[s.refPriorityBadge, { backgroundColor: ref.priorityColor }]}>
                  <Text style={s.refPriorityText}>{ref.priority}</Text>
                </View>
              </View>
              <Text style={s.refDate}>{ref.date}</Text>
              <View style={s.refDoctorsRow}>
                <View style={s.refDoctorCard}>
                  <Text style={s.refDoctorName}>{ref.fromDoctor.name}</Text>
                  <Text style={s.refDoctorSpec}>{ref.fromDoctor.specialty}</Text>
                </View>
                <ArrowLeftRight size={16} color={colors.textTertiary} />
                <View style={s.refDoctorCard}>
                  <Text style={s.refDoctorName}>{ref.toDoctor.name}</Text>
                  <Text style={s.refDoctorSpec}>{ref.toDoctor.specialty}</Text>
                </View>
              </View>
              <View style={s.refReasonBox}>
                <FileText size={14} color={colors.textSecondary} />
                <View style={s.refReasonContent}>
                  <Text style={s.refReasonTitle}>{ref.reason}</Text>
                  <Text style={s.refReasonDesc}>{ref.description}</Text>
                </View>
              </View>
              {ref.status !== 'Completed' && (
                <View style={s.refActionsRow}>
                  <Pressable style={s.refActionBtn}><Text style={s.refActionBtnText}>Follow Up</Text></Pressable>
                  <Pressable style={s.refActionBtnOutline}><Text style={s.refActionOutlineText}>Cancel Referral</Text></Pressable>
                </View>
              )}
              {ref.status === 'Completed' && (
                <View style={s.refActionsRow}>
                  <Pressable><Text style={s.detailsLink}>View Details</Text></Pressable>
                </View>
              )}
            </View>
          ))}
        </Card>

        {/* Dental Chart */}
        <DentalChartView />

        {/* Educational Resources */}
        <Card style={s.sectionCard}>
          <View style={s.sectionHeaderRow}>
            <View style={s.sectionHeaderLeft}>
              <BookOpen size={18} color={colors.primary} />
              <Text style={s.sectionHeaderTitle}>Educational Resources</Text>
            </View>
            <Pressable>
              <Text style={s.viewAllText}>Browse All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.resourcesScroll}>
            {educationalResources.map(res => {
              const ResIcon = resourceIconMap[res.type] || FileText;
              return (
                <View key={res.id} style={s.resourceCard}>
                  <View style={s.resourceImageContainer}>
                    <Image source={{ uri: res.imageUrl }} style={s.resourceImage} />
                    <View style={s.resourceTypeBadge}>
                      <Text style={s.resourceTypeText}>{res.type}</Text>
                    </View>
                  </View>
                  <View style={s.resourceInfo}>
                    <View style={s.resourceDurationRow}>
                      <ResIcon size={12} color={colors.textTertiary} />
                      <Text style={s.resourceDuration}>{res.duration}</Text>
                    </View>
                    <Text style={s.resourceTitle}>{res.title}</Text>
                    <Pressable><Text style={s.resourceLink}>Learn More</Text></Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safeTop: {
    backgroundColor: colors.surface,
    zIndex: 20,
    elevation: 20,
    overflow: 'visible' as const,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    overflow: 'visible' as const,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent',
  },
  logoV: { fontSize: 18, fontWeight: '800' as const, color: '#FFFFFF' },
  logoText: { fontSize: 18, lineHeight: 22 },
  logoBold: { fontWeight: '700' as const, color: colors.textPrimary },
  logoLight: { fontWeight: '400' as const, color: colors.textSecondary },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    position: 'relative' as const,
    overflow: 'visible' as const,
  },
  bellBtn: { position: 'relative' as const },
  bellBadge: {
    position: 'absolute' as const, top: -5, right: -6,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.error, borderWidth: 1.5, borderColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontSize: 9, fontWeight: '700' as const, color: '#fff', lineHeight: 11,
  },
  notificationDropdown: {
    position: 'absolute' as const,
    top: 44,
    right: 0,
    width: 260,
    zIndex: 1000,
    elevation: 8,
  },
  notificationDropdownBody: {
    minHeight: 190,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.md,
  },
  notificationHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  notificationTitle: {
    ...typography.callout,
    color: colors.textPrimary,
    fontWeight: '700' as const,
  },
  notificationEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  notificationEmptyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  notificationEmptyText: {
    ...typography.callout,
    color: colors.textTertiary,
    fontWeight: '600' as const,
  },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: spacing.md, paddingBottom: spacing.xxxl },

  welcomeCard: { marginHorizontal: spacing.xl, marginBottom: spacing.xxl },
  welcomeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  welcomeTitle: { ...typography.title, color: colors.textPrimary },
  welcomeSubtitle: { ...typography.callout, color: colors.textSecondary, marginBottom: spacing.lg },
  welcomeStatsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  welcomeStat: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary, borderRadius: borderRadius.md, padding: spacing.md,
  },
  welcomeStatIcon: {
    width: 40, height: 40, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  welcomeStatValue: { ...typography.title3, color: colors.textPrimary },
  welcomeStatLabel: { ...typography.small, color: colors.textSecondary, lineHeight: 14 },
  reminderBox: { backgroundColor: '#EDF3FA', borderRadius: borderRadius.md, padding: spacing.md },
  reminderBold: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.xs },
  reminderText: { ...typography.callout, color: colors.textSecondary, lineHeight: 20 },

  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.xxl,
  },
  actionItem: {
    width: '23%' as unknown as number, flexGrow: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.xs,
    minHeight: 90,
  },
  actionLabel: {
    ...typography.small, fontWeight: '600' as const, textAlign: 'center', marginTop: spacing.sm,
  },

  insuranceContainer: { marginBottom: spacing.xxl },
  insuranceScroll: { paddingHorizontal: spacing.xl },
  insuranceCard: {
    width: 280, backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginRight: spacing.md, ...shadow.md,
  },
  insuranceHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  insuranceIconBox: {
    width: 40, height: 40, borderRadius: borderRadius.md,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  insuranceTitleCol: { flex: 1 },
  insuranceType: { ...typography.headline, color: colors.textPrimary },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeText: { ...typography.small, color: '#22C55E', fontWeight: '600' as const },
  insuranceProviderBox: {
    backgroundColor: colors.surfaceSecondary, borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.md,
  },
  insuranceProviderLabel: { ...typography.caption, color: colors.textSecondary },
  insuranceProviderName: { ...typography.headline, color: colors.primary, marginTop: 2 },
  insuranceInfoRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  insuranceInfoCol: { flex: 1 },
  insuranceInfoLabel: { ...typography.small, color: colors.textTertiary },
  insuranceInfoValue: { ...typography.callout, color: colors.textPrimary, fontWeight: '600' as const },
  insuranceHolderBox: {
    backgroundColor: colors.surfaceSecondary, borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.md,
  },
  insuranceHolderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  insuranceHolderLabel: { ...typography.caption, color: colors.textSecondary },
  insuranceHolderValue: { ...typography.callout, color: colors.textPrimary, fontWeight: '600' as const },
  insuranceLine: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, alignItems: 'flex-start'
  },
  insuranceLineLabel: { ...typography.caption, color: colors.textSecondary, marginRight: spacing.sm },
  insuranceLineValue: { ...typography.callout, color: colors.textPrimary, fontWeight: '600' as const, flexShrink: 1, textAlign: 'right' },
  insuranceServiceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  insuranceServiceLabel: { ...typography.caption, color: colors.textSecondary },
  insuranceServiceNumber: { ...typography.headline, color: colors.primary, marginBottom: spacing.md },
  insurancePortalBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: spacing.sm, alignItems: 'center',
  },
  insurancePortalText: { ...typography.callout, color: colors.textInverse, fontWeight: '600' as const },

  sectionCard: { marginHorizontal: spacing.xl, marginBottom: spacing.xxl },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  sectionHeaderTitle: { ...typography.headline, color: colors.textPrimary },
  viewAllText: {
    ...typography.callout, color: colors.textSecondary, fontWeight: '500' as const,
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    overflow: 'hidden',
  },

  insightCard: {
    borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.md,
    borderLeftWidth: 3, borderLeftColor: 'transparent',
  },
  insightTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  insightTitle: { ...typography.headline },
  insightDesc: { ...typography.callout, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.sm },
  insightAction: { ...typography.callout, color: colors.primary, fontWeight: '600' as const },

  scheduleBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  scheduleBtnText: { ...typography.callout, color: colors.textSecondary, fontWeight: '500' as const },
  apptCard: {
    borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  apptRow: { flexDirection: 'row', gap: spacing.md },
  apptIconBox: {
    width: 44, height: 44, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  apptContent: { flex: 1 },
  apptCatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  catBadge: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 1,
  },
  catBadgeText: { ...typography.small, color: colors.textSecondary },
  detailsLink: { ...typography.callout, color: colors.textSecondary, fontWeight: '500' as const },
  apptTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: 2 },
  apptProvider: { ...typography.callout, color: colors.textSecondary, marginBottom: spacing.sm },
  apptMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  apptMetaText: { ...typography.caption, color: colors.textTertiary },

  tabRow: {
    flexDirection: 'row', backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md, padding: 3, marginBottom: spacing.lg,
  },
  tabItem: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.sm },
  tabItemActive: { backgroundColor: colors.surface, ...shadow.sm },
  tabItemText: { ...typography.caption, color: colors.textTertiary, fontWeight: '600' as const },
  tabItemTextActive: { color: colors.textPrimary },

  recordItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  recordIconBox: {
    width: 40, height: 40, borderRadius: borderRadius.md,
    backgroundColor: colors.primaryFaded, alignItems: 'center', justifyContent: 'center',
  },
  recordInfo: { flex: 1 },
  recordTitle: { ...typography.headline, color: colors.textPrimary },
  recordMeta: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
  recordAction: { padding: spacing.xs },

  newRefBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  newRefBtnText: { ...typography.caption, color: colors.textInverse, fontWeight: '600' as const },
  refCard: {
    borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  refHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.xs },
  refNumber: { ...typography.headline, color: colors.textPrimary },
  refStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  refStatusText: { ...typography.small, fontWeight: '600' as const },
  refPriorityBadge: { borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  refPriorityText: { ...typography.small, color: colors.textInverse, fontWeight: '600' as const },
  refDate: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.md },
  refDoctorsRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md,
  },
  refDoctorCard: {
    flex: 1, borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: borderRadius.md, padding: spacing.sm,
  },
  refDoctorName: { ...typography.callout, color: colors.primary, fontWeight: '600' as const },
  refDoctorSpec: { ...typography.small, color: colors.textSecondary },
  refReasonBox: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  refReasonContent: { flex: 1 },
  refReasonTitle: { ...typography.callout, color: colors.textPrimary, fontWeight: '600' as const },
  refReasonDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  refActionsRow: { flexDirection: 'row', gap: spacing.sm },
  refActionBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  refActionBtnText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' as const },
  refActionBtnOutline: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  refActionOutlineText: { ...typography.caption, color: colors.textSecondary },

  resourcesScroll: { marginHorizontal: -spacing.lg },
  resourceCard: {
    width: 180, marginRight: spacing.md, borderRadius: borderRadius.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  resourceImageContainer: { position: 'relative' as const },
  resourceImage: { width: '100%', height: 110 },
  resourceTypeBadge: {
    position: 'absolute' as const, top: spacing.sm, left: spacing.sm,
    backgroundColor: colors.surface, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  resourceTypeText: { ...typography.small, color: colors.textPrimary, fontWeight: '600' as const },
  resourceInfo: { padding: spacing.md },
  resourceDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.xs },
  resourceDuration: { ...typography.small, color: colors.textTertiary },
  resourceTitle: { ...typography.callout, color: colors.textPrimary, fontWeight: '600' as const, marginBottom: spacing.sm },
  resourceLink: { ...typography.caption, color: colors.primary, fontWeight: '600' as const },
});

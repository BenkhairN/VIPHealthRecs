import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Download, Filter, CreditCard, X, Check } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadow } from '@/constants/theme';
import { ledgerTransactions } from '@/mocks/dashboardData';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const ALL_STATUSES = ['Paid in Full', 'Insurance Processing', 'Payment Pending', 'Partial Payment'];

const statusColors: Record<string, { bg: string; text: string }> = {
  'Paid in Full': { bg: '#DCFCE7', text: '#166534' },
  'Insurance Processing': { bg: '#FEF3C7', text: '#92400E' },
  'Payment Pending': { bg: '#FEE2E2', text: '#991B1B' },
  'Partial Payment': { bg: '#DBEAFE', text: '#1E40AF' },
};

function buildHtml(totalCharges: number, totalInsurance: number, totalPatient: number, outstanding: number) {
  const rows = ledgerTransactions.map(t => `
    <tr>
      <td>${t.date}</td>
      <td>${t.procedure}</td>
      <td>${t.cdt}</td>
      <td>${t.tooth !== '-' ? t.tooth : '-'}</td>
      <td>${t.provider}</td>
      <td>$${t.fee.toLocaleString()}</td>
      <td>${t.insurance > 0 ? `-$${t.insurance.toLocaleString()}` : '-'}</td>
      <td>$${t.patient.toLocaleString()}</td>
      <td>${t.balance > 0 ? `$${t.balance.toLocaleString()}` : '-'}</td>
      <td>${t.status}</td>
    </tr>`).join('');

  return `
    <html><head><style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; }
      h1 { color: #1d4ed8; font-size: 22px; margin-bottom: 4px; }
      p { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
      .summary { display: flex; gap: 12px; margin-bottom: 24px; }
      .card { background: #f3f4f6; border-radius: 8px; padding: 12px 20px; flex: 1; }
      .card-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
      .card-value { font-size: 18px; font-weight: bold; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #1d4ed8; color: white; padding: 8px; text-align: left; }
      td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
      tr:nth-child(even) { background: #f9fafb; }
    </style></head><body>
      <h1>Dental Ledger Statement</h1>
      <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <div class="summary">
        <div class="card"><div class="card-label">Total Charges</div><div class="card-value">$${totalCharges.toLocaleString()}</div></div>
        <div class="card"><div class="card-label">Insurance Paid</div><div class="card-value" style="color:#166534">$${totalInsurance.toLocaleString()}</div></div>
        <div class="card"><div class="card-label">Patient Paid</div><div class="card-value" style="color:#1d4ed8">$${totalPatient.toLocaleString()}</div></div>
        <div class="card"><div class="card-label">Outstanding</div><div class="card-value" style="color:${outstanding > 0 ? '#92400E' : '#166534'}">$${outstanding.toLocaleString()}</div></div>
      </div>
      <table>
        <thead><tr>
          <th>Date</th><th>Procedure</th><th>CDT</th><th>Tooth</th><th>Provider</th>
          <th>Fee</th><th>Insurance</th><th>Patient</th><th>Balance</th><th>Status</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;
}

export default function LedgerScreen() {
  const [exporting, setExporting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const filteredTransactions = useMemo(() => {
    return ledgerTransactions.filter(t =>
      selectedStatuses.length === 0 || selectedStatuses.includes(t.status)
    );
  }, [selectedStatuses]);

  const hasActiveFilters = selectedStatuses.length > 0;

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSelectedStatuses([]);
  };

  const totalCharges = ledgerTransactions.reduce((s, t) => s + t.fee, 0);
  const totalInsurance = ledgerTransactions.reduce((s, t) => s + t.insurance, 0);
  const totalPatient = ledgerTransactions.reduce((s, t) => s + t.patient, 0);
  const outstanding = ledgerTransactions.reduce((s, t) => s + t.balance, 0);

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const html = buildHtml(totalCharges, totalInsurance, totalPatient, outstanding);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export Dental Ledger PDF' });
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrintStatement = async () => {
    try {
      setPrinting(true);
      const html = buildHtml(totalCharges, totalInsurance, totalPatient, outstanding);
      await Print.printAsync({ html });
    } catch (e) {
      Alert.alert('Print Failed', 'Could not open print dialog. Please try again.');
    } finally {
      setPrinting(false);
    }
  };

  const handlePay = () => {
    Alert.alert(
      `Pay $${outstanding}`,
      'Choose a payment method to settle your balance.',
      [
        {
          text: 'Pay with Card',
          onPress: () => {
            setPaying(true);
            setTimeout(() => {
              setPaying(false);
              Alert.alert('Payment Successful', `$${outstanding} has been paid successfully.`);
            }, 1500);
          },
          
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={s.safeTop}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <FileText size={22} color={colors.primary} />
            <Text style={s.headerTitle}>Dental Ledger</Text>
          </View>
          <Pressable style={[s.filterBtn, hasActiveFilters && s.filterBtnActive]} onPress={() => setShowFilter(true)}>
            <Filter size={18} color={hasActiveFilters ? colors.primary : colors.textSecondary} />
            {hasActiveFilters && <View style={s.filterDot} />}
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.summaryGrid}>
          <View style={[s.summaryCard, { backgroundColor: '#EDF3FA' }]}>
            <Text style={s.summaryLabel}>Total Charges</Text>
            <Text style={s.summaryValue}>${totalCharges.toLocaleString()}</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: '#DCFCE7' }]}>
            <Text style={s.summaryLabel}>Insurance Paid</Text>
            <Text style={[s.summaryValue, { color: '#166534' }]}>${totalInsurance.toLocaleString()}</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: '#DBEAFE' }]}>
            <Text style={s.summaryLabel}>Patient Paid</Text>
            <Text style={[s.summaryValue, { color: '#1E40AF' }]}>${totalPatient.toLocaleString()}</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: outstanding > 0 ? '#FEF3C7' : '#DCFCE7' }]}>
            <Text style={s.summaryLabel}>Outstanding</Text>
            <Text style={[s.summaryValue, { color: outstanding > 0 ? '#92400E' : '#166534' }]}>${outstanding.toLocaleString()}</Text>
          </View>
        </View>

        <View style={s.actionsRow}>
          <Pressable style={[s.actionBtn, exporting && s.actionBtnDisabled]} onPress={handleExportPDF} disabled={exporting}>
            {exporting ? <ActivityIndicator size={16} color={colors.primary} /> : <Download size={16} color={colors.primary} />}
            <Text style={s.actionBtnText}>{exporting ? 'Exporting...' : 'Export PDF'}</Text>
          </Pressable>
          <Pressable style={[s.actionBtn, printing && s.actionBtnDisabled]} onPress={handlePrintStatement} disabled={printing}>
            {printing ? <ActivityIndicator size={16} color={colors.primary} /> : <FileText size={16} color={colors.primary} />}
            <Text style={s.actionBtnText}>{printing ? 'Opening...' : 'Print Statement'}</Text>
          </Pressable>
          {outstanding > 0 && (
            <Pressable style={[s.actionBtn, s.actionBtnPrimary, paying && s.actionBtnDisabled]} onPress={handlePay} disabled={paying}>
              {paying ? <ActivityIndicator size={16} color={colors.textInverse} /> : <CreditCard size={16} color={colors.textInverse} />}
              <Text style={s.actionBtnTextPrimary}>{paying ? 'Processing...' : `Pay $${outstanding}`}</Text>
            </Pressable>
          )}
        </View>

        <View style={s.transTitleRow}>
          <Text style={s.transTitle}>Transaction History</Text>
          <Text style={s.transCount}>{filteredTransactions.length} of {ledgerTransactions.length}</Text>
        </View>

        {filteredTransactions.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>No transactions match your filters.</Text>
            <Pressable onPress={clearFilters}><Text style={s.emptyStateClear}>Clear Filters</Text></Pressable>
          </View>
        )}

        {filteredTransactions.map(t => {
          const sc = statusColors[t.status] || statusColors['Paid in Full'];
          return (
            <View key={t.id} style={s.transCard}>
              <View style={s.transHeader}>
                <Text style={s.transDate}>{t.date}</Text>
                <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[s.statusText, { color: sc.text }]}>{t.status}</Text>
                </View>
              </View>
              <Text style={s.transProcedure}>{t.procedure}</Text>
              <View style={s.transDetails}>
                <Text style={s.transDetailText}>CDT: {t.cdt}</Text>
                {t.tooth !== '-' && <Text style={s.transDetailText}>Tooth: {t.tooth}</Text>}
                <Text style={s.transDetailText}>{t.provider}</Text>
              </View>
              <View style={s.transAmounts}>
                <View style={s.transAmountItem}>
                  <Text style={s.transAmountLabel}>Fee</Text>
                  <Text style={s.transAmountValue}>${t.fee.toLocaleString()}</Text>
                </View>
                <View style={s.transAmountItem}>
                  <Text style={s.transAmountLabel}>Insurance</Text>
                  <Text style={[s.transAmountValue, { color: '#166534' }]}>
                    {t.insurance > 0 ? `-$${t.insurance.toLocaleString()}` : '-'}
                  </Text>
                </View>
                <View style={s.transAmountItem}>
                  <Text style={s.transAmountLabel}>Patient</Text>
                  <Text style={[s.transAmountValue, { color: colors.primary }]}>${t.patient.toLocaleString()}</Text>
                </View>
                {t.balance > 0 && (
                  <View style={s.transAmountItem}>
                    <Text style={s.transAmountLabel}>Balance</Text>
                    <Text style={[s.transAmountValue, { color: '#F59E0B' }]}>${t.balance.toLocaleString()}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={showFilter} transparent animationType="slide" onRequestClose={() => setShowFilter(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowFilter(false)}>
          <Pressable style={s.modalSheet} onPress={e => e.stopPropagation()}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Filter Transactions</Text>
              <Pressable onPress={() => setShowFilter(false)}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={s.filterSectionLabel}>STATUS</Text>
            <View style={s.filterChips}>
              {ALL_STATUSES.map(status => {
                const active = selectedStatuses.includes(status);
                const sc = statusColors[status];
                return (
                  <Pressable
                    key={status}
                    style={[s.filterChip, active && { backgroundColor: sc.bg, borderColor: sc.text }]}
                    onPress={() => toggleStatus(status)}
                  >
                    {active && <Check size={12} color={sc.text} />}
                    <Text style={[s.filterChipText, active && { color: sc.text }]}>{status}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={s.modalActions}>
              <Pressable style={s.clearBtn} onPress={clearFilters}>
                <Text style={s.clearBtnText}>Clear All</Text>
              </Pressable>
              <Pressable style={s.applyBtn} onPress={() => setShowFilter(false)}>
                <Text style={s.applyBtnText}>Apply Filters</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safeTop: { backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { ...typography.title, color: colors.textPrimary },
  filterBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.lg,
  },
  summaryCard: {
    width: '48%' as unknown as number,
    flexGrow: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  summaryLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  summaryValue: { fontSize: 20, fontWeight: '700' as const, color: colors.textPrimary },
  actionsRow: {
    flexDirection: 'row', paddingHorizontal: spacing.xl,
    gap: spacing.sm, marginBottom: spacing.xxl,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderWidth: 1, borderColor: colors.primary, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  actionBtnText: { ...typography.caption, color: colors.primary, fontWeight: '600' as const },
  actionBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnTextPrimary: { ...typography.caption, color: colors.textInverse, fontWeight: '600' as const },
  transTitle: {
    ...typography.title3, color: colors.textPrimary,
    paddingHorizontal: spacing.xl, marginBottom: spacing.md,
  },
  transCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginHorizontal: spacing.xl,
    marginBottom: spacing.md, ...shadow.sm,
  },
  transHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  transDate: { ...typography.caption, color: colors.textTertiary },
  statusBadge: { borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusText: { ...typography.small, fontWeight: '600' as const },
  transProcedure: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.xs },
  transDetails: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    marginBottom: spacing.md,
  },
  transDetailText: { ...typography.caption, color: colors.textSecondary },
  transAmounts: { flexDirection: 'row', gap: spacing.md },
  transAmountItem: {},
  transAmountLabel: { ...typography.small, color: colors.textTertiary },
  transAmountValue: { ...typography.callout, color: colors.textPrimary, fontWeight: '600' as const },

  filterBtnActive: { backgroundColor: colors.primaryFaded },
  filterDot: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary,
  },

  transTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, marginBottom: spacing.md,
  },
  transCount: { ...typography.caption, color: colors.textTertiary },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyStateText: { ...typography.callout, color: colors.textSecondary, marginBottom: spacing.sm },
  emptyStateClear: { ...typography.callout, color: colors.primary, fontWeight: '600' as const },

  modalOverlay: {
    flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.xl, paddingBottom: spacing.xxxl, ...shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: { ...typography.title3, color: colors.textPrimary },

  filterSectionLabel: {
    ...typography.caption, color: colors.textTertiary,
    fontWeight: '600' as const, letterSpacing: 0.5,
    marginBottom: spacing.sm, marginTop: spacing.md,
  },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.primaryFaded, borderColor: colors.primary },
  filterChipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' as const },

  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  clearBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  clearBtnText: { ...typography.callout, color: colors.textSecondary, fontWeight: '600' as const },
  applyBtn: {
    flex: 2, backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  applyBtnText: { ...typography.callout, color: '#fff', fontWeight: '600' as const },
});

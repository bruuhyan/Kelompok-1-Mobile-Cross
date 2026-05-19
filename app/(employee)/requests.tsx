/**
 * Employee Requests Screen
 * Submit holiday and overtime requests.
 */

import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BorderRadius, Spacing, ThemeColors, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { requestService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/constants';
import type { Request as EmployeeRequest } from '@/utils/types';

type RequestMode = 'holiday' | 'overtime';

type HolidayErrors = {
  startDate?: string;
  endDate?: string;
  reason?: string;
};

type OvertimeErrors = {
  date?: string;
  hours?: string;
  reason?: string;
};

const getTodayInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const isValidDateInput = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
};

const isEndDateBeforeStartDate = (startDate: string, endDate: string) => {
  return new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`);
};

const formatDate = (value: string) => {
  if (!value) return '-';

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function EmployeeRequestsScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const user = useAuthStore((state) => state.user);

  const [mode, setMode] = useState<RequestMode>('holiday');
  const [holidayStartDate, setHolidayStartDate] = useState(getTodayInputValue());
  const [holidayEndDate, setHolidayEndDate] = useState(getTodayInputValue());
  const [holidayReason, setHolidayReason] = useState('');
  const [overtimeDate, setOvertimeDate] = useState(getTodayInputValue());
  const [overtimeHours, setOvertimeHours] = useState('');
  const [overtimeReason, setOvertimeReason] = useState('');
  const [holidayErrors, setHolidayErrors] = useState<HolidayErrors>({});
  const [overtimeErrors, setOvertimeErrors] = useState<OvertimeErrors>({});
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!user?.id) return;

    setIsRefreshing(true);
    try {
      const data = await requestService.getUserRequests(user.id);
      setRequests(data as EmployeeRequest[]);
    } catch (error) {
      console.error('Load requests error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests]),
  );

  const validateHoliday = () => {
    const nextErrors: HolidayErrors = {};

    if (!holidayStartDate.trim()) {
      nextErrors.startDate = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (!isValidDateInput(holidayStartDate.trim())) {
      nextErrors.startDate = 'Use YYYY-MM-DD format';
    }

    if (!holidayEndDate.trim()) {
      nextErrors.endDate = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (!isValidDateInput(holidayEndDate.trim())) {
      nextErrors.endDate = 'Use YYYY-MM-DD format';
    }

    if (
      isValidDateInput(holidayStartDate.trim()) &&
      isValidDateInput(holidayEndDate.trim()) &&
      isEndDateBeforeStartDate(holidayStartDate.trim(), holidayEndDate.trim())
    ) {
      nextErrors.endDate = 'End date cannot be before start date';
    }

    if (!holidayReason.trim()) {
      nextErrors.reason = ERROR_MESSAGES.REQUIRED_FIELD;
    }

    setHolidayErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateOvertime = () => {
    const nextErrors: OvertimeErrors = {};
    const hours = Number(overtimeHours);

    if (!overtimeDate.trim()) {
      nextErrors.date = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (!isValidDateInput(overtimeDate.trim())) {
      nextErrors.date = 'Use YYYY-MM-DD format';
    }

    if (!overtimeHours.trim()) {
      nextErrors.hours = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (Number.isNaN(hours) || hours <= 0) {
      nextErrors.hours = 'Hours must be greater than 0';
    } else if (hours > 24) {
      nextErrors.hours = 'Hours cannot be more than 24';
    }

    if (!overtimeReason.trim()) {
      nextErrors.reason = ERROR_MESSAGES.REQUIRED_FIELD;
    }

    setOvertimeErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmitHoliday = async () => {
    if (!validateHoliday()) return;
    if (!user?.id || !user.organization_id) {
      Alert.alert('Error', 'User profile is not ready yet');
      return;
    }

    setIsLoading(true);
    try {
      await requestService.submitHolidayRequest(user.id, user.organization_id, {
        start_date: holidayStartDate.trim(),
        end_date: holidayEndDate.trim(),
        reason: holidayReason,
      });

      setHolidayReason('');
      Alert.alert('Success', SUCCESS_MESSAGES.REQUEST_SUBMITTED);
      await loadRequests();
    } catch (error: any) {
      console.error('Submit holiday request error:', error);
      Alert.alert('Error', error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitOvertime = async () => {
    if (!validateOvertime()) return;
    if (!user?.id || !user.organization_id) {
      Alert.alert('Error', 'User profile is not ready yet');
      return;
    }

    setIsLoading(true);
    try {
      await requestService.submitOvertimeRequest(user.id, user.organization_id, {
        date: overtimeDate.trim(),
        hours: Number(overtimeHours),
        reason: overtimeReason,
      });

      setOvertimeHours('');
      setOvertimeReason('');
      Alert.alert('Success', SUCCESS_MESSAGES.REQUEST_SUBMITTED);
      await loadRequests();
    } catch (error: any) {
      console.error('Submit overtime request error:', error);
      Alert.alert('Error', error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: EmployeeRequest['status']) => {
    switch (status) {
      case 'approved':
        return colors.success;
      case 'rejected':
      case 'disapproved':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  const renderRequestItem = (request: EmployeeRequest) => {
    const isHoliday = request.type === 'holiday';

    return (
      <Card key={request.id} style={styles.historyItem}>
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.historyTitle}>
              {isHoliday ? 'Holiday Request' : 'Overtime Request'}
            </Text>
            <Text style={styles.historyDate}>
              {isHoliday
                ? `${formatDate(request.start_date)} - ${formatDate(request.end_date || request.start_date)}`
                : `${formatDate(request.start_date)}${request.hours ? `, ${request.hours} hours` : ''}`}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
            <Text style={styles.statusText}>{request.status}</Text>
          </View>
        </View>
        <Text style={styles.historyReason} numberOfLines={2}>
          {request.reason}
        </Text>
      </Card>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Requests</Text>
          <Text style={styles.subtitle}>Submit holiday or overtime requests</Text>
        </View>

        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentButton, mode === 'holiday' && styles.segmentButtonActive]}
            onPress={() => setMode('holiday')}>
            <Text style={[styles.segmentText, mode === 'holiday' && styles.segmentTextActive]}>
              Holiday
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, mode === 'overtime' && styles.segmentButtonActive]}
            onPress={() => setMode('overtime')}>
            <Text style={[styles.segmentText, mode === 'overtime' && styles.segmentTextActive]}>
              Overtime
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.formCard}>
          {mode === 'holiday' ? (
            <>
              <Text style={styles.formTitle}>Holiday Request</Text>
              <Input
                label="Start Date"
                placeholder="YYYY-MM-DD"
                value={holidayStartDate}
                onChangeText={setHolidayStartDate}
                autoCapitalize="none"
                error={holidayErrors.startDate}
              />
              <Input
                label="End Date"
                placeholder="YYYY-MM-DD"
                value={holidayEndDate}
                onChangeText={setHolidayEndDate}
                autoCapitalize="none"
                error={holidayErrors.endDate}
              />
              <Input
                label="Reason"
                placeholder="Tell your supervisor why you need leave"
                value={holidayReason}
                onChangeText={setHolidayReason}
                multiline
                numberOfLines={4}
                error={holidayErrors.reason}
              />
              <Button
                title="Submit Holiday Request"
                onPress={handleSubmitHoliday}
                loading={isLoading}
                disabled={isLoading}
                size="large"
              />
            </>
          ) : (
            <>
              <Text style={styles.formTitle}>Overtime Request</Text>
              <Input
                label="Date"
                placeholder="YYYY-MM-DD"
                value={overtimeDate}
                onChangeText={setOvertimeDate}
                autoCapitalize="none"
                error={overtimeErrors.date}
              />
              <Input
                label="Hours"
                placeholder="Example: 2"
                value={overtimeHours}
                onChangeText={setOvertimeHours}
                keyboardType="numeric"
                error={overtimeErrors.hours}
              />
              <Input
                label="Reason"
                placeholder="Describe the overtime work"
                value={overtimeReason}
                onChangeText={setOvertimeReason}
                multiline
                numberOfLines={4}
                error={overtimeErrors.reason}
              />
              <Button
                title="Submit Overtime Request"
                onPress={handleSubmitOvertime}
                loading={isLoading}
                disabled={isLoading}
                size="large"
              />
            </>
          )}
        </Card>

        <View style={styles.historySectionHeader}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          <TouchableOpacity onPress={loadRequests} disabled={isRefreshing}>
            <Text style={styles.refreshText}>{isRefreshing ? 'Loading...' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>

        {requests.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No requests yet</Text>
            <Text style={styles.emptySubtitle}>Submitted requests will appear here.</Text>
          </Card>
        ) : (
          requests.map(renderRequestItem)
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing['3xl'],
    },
    header: {
      marginBottom: Spacing.lg,
    },
    title: {
      fontSize: Typography['3xl'],
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: Typography.base,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundLight,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    segmentButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.sm,
    },
    segmentButtonActive: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      fontSize: Typography.sm,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    segmentTextActive: {
      color: colors.background,
    },
    formCard: {
      marginBottom: Spacing.xl,
    },
    formTitle: {
      fontSize: Typography.xl,
      fontWeight: '700',
      color: colors.text,
      marginBottom: Spacing.lg,
    },
    historySectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: Typography.lg,
      fontWeight: '700',
      color: colors.text,
    },
    refreshText: {
      fontSize: Typography.sm,
      fontWeight: '700',
      color: colors.primary,
    },
    emptyCard: {
      alignItems: 'center',
    },
    emptyTitle: {
      fontSize: Typography.base,
      fontWeight: '700',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    emptySubtitle: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    historyItem: {
      marginBottom: Spacing.md,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    historyTitle: {
      fontSize: Typography.base,
      fontWeight: '700',
      color: colors.text,
    },
    historyDate: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    statusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
    },
    statusText: {
      fontSize: Typography.xs,
      fontWeight: '800',
      color: colors.background,
      textTransform: 'capitalize',
    },
    historyReason: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      marginTop: Spacing.md,
      lineHeight: 20,
    },
  });

/**
 * Supervisor Task Screen
 * Assign tasks to employees and review submitted work.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Spacing, ThemeColors, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Card } from '@/components/Card';
import { DatePickerInput } from '@/components/DatePickerInput';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { supervisorService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import DecorativeShapes from "@/components/DecorativeShapes";

type AssignableEmployee = {
  id: string;
  name: string;
  email: string;
  trust_score?: number;
};

type TeamTask = {
  id: string;
  title: string;
  description: string;
  due_date?: string | null;
  status: 'assigned' | 'submitted' | 'approved' | 'rejected';
  submission_note?: string | null;
  submitted_at?: string | null;
  review_notes?: string | null;
  created_at: string;
  assignee?: AssignableEmployee | null;
};

const statusLabels: Record<TeamTask['status'], string> = {
  assigned: 'Assigned',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function SupervisorTaskScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const user = useAuthStore((state) => state.user);
  const [employees, setEmployees] = useState<AssignableEmployee[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadTaskData = useCallback(async () => {
    if (!user?.organization_id) return;

    try {
      const [employeeData, taskData] = await Promise.all([
        supervisorService.getAssignableEmployees(user.organization_id),
        supervisorService.getTasks(user.organization_id),
      ]);

      const nextEmployees = employeeData as AssignableEmployee[];
      setEmployees(nextEmployees);
      setTasks(taskData as TeamTask[]);
      setSelectedEmployeeId((current) => current || nextEmployees[0]?.id || null);
    } catch (error) {
      console.error('Load task data error:', error);
      Alert.alert('Error', 'Failed to load task data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.organization_id]);

  useEffect(() => {
    loadTaskData();
  }, [loadTaskData]);

  const submittedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'submitted'),
    [tasks],
  );

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status === 'assigned' || task.status === 'submitted'),
    [tasks],
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadTaskData();
  };

  const handleCreateTask = async () => {
    if (!user?.id || !user.organization_id || !selectedEmployeeId) {
      Alert.alert('Employee Required', 'Choose an employee before assigning a task');
      return;
    }

    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Details', 'Task title and description are required');
      return;
    }

    setCreating(true);
    try {
      const created = await supervisorService.createTask({
        organization_id: user.organization_id,
        assigned_to: selectedEmployeeId,
        created_by: user.id,
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate.trim() || null,
      });

      setTasks((current) => [created as TeamTask, ...current]);
      setTitle('');
      setDescription('');
      setDueDate('');
      Alert.alert('Success', 'Task assigned successfully');
    } catch (error) {
      console.error('Create task error:', error);
      Alert.alert('Error', 'Failed to assign task');
    } finally {
      setCreating(false);
    }
  };

  const handleReviewTask = async (taskId: string, status: 'approved' | 'rejected') => {
    if (!user?.id) return;

    setReviewingId(taskId);
    try {
      const updated = await supervisorService.reviewTask(taskId, user.id, status);
      setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, ...updated } : task)));
      Alert.alert('Success', `Task ${status}`);
    } catch (error) {
      console.error('Review task error:', error);
      Alert.alert('Error', 'Failed to review task');
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <DecorativeShapes variant="supervisor" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>Task Management</Text>
        <Text style={styles.headerTitle}>Assign & Review</Text>
        <Text style={styles.headerSubtitle}>
          {submittedTasks.length} submitted tasks waiting for review
        </Text>
      </View>

      <Card style={styles.formCard}>
        <Text style={styles.cardTitle}>New Task</Text>
        <Text style={styles.fieldLabel}>Employee</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.employeePicker}>
          {employees.length === 0 ? (
            <Text style={styles.emptyInline}>No active employees available</Text>
          ) : (
            employees.map((employee) => (
              <TouchableOpacity
                key={employee.id}
                style={[
                  styles.employeeChip,
                  selectedEmployeeId === employee.id && styles.employeeChipSelected,
                ]}
                onPress={() => setSelectedEmployeeId(employee.id)}>
                <Text
                  style={[
                    styles.employeeChipName,
                    selectedEmployeeId === employee.id && styles.employeeChipNameSelected,
                  ]}>
                  {employee.name}
                </Text>
                <Text
                  style={[
                    styles.employeeChipEmail,
                    selectedEmployeeId === employee.id && styles.employeeChipEmailSelected,
                  ]}
                  numberOfLines={1}>
                  {employee.email}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <TaskInput label="Title" value={title} onChangeText={setTitle} placeholder="Example: Prepare weekly summary" />
        <TaskInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Add the task details"
          multiline
          minHeight={96}
        />
        <DatePickerInput label="Due Date" value={dueDate} onChange={setDueDate} placeholder="Select due date (optional)" />

        <TouchableOpacity
          style={[styles.primaryButton, (creating || employees.length === 0) && styles.disabledButton]}
          disabled={creating || employees.length === 0}
          onPress={handleCreateTask}>
          {creating ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <IconSymbol name="doc.text.fill" size={18} color={colors.background} />
              <Text style={styles.primaryButtonText}>Assign Task</Text>
            </>
          )}
        </TouchableOpacity>
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Task Review</Text>
        <Text style={styles.sectionMeta}>{activeTasks.length} active</Text>
      </View>

      <View style={styles.list}>
        {tasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <IconSymbol name="doc.text.fill" size={32} color={colors.primary} />
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptyText}>Tasks assigned to employees will appear here.</Text>
          </Card>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              reviewing={reviewingId === task.id}
              onApprove={() => handleReviewTask(task.id, 'approved')}
              onReject={() => handleReviewTask(task.id, 'rejected')}
            />
          ))
        )}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TaskInput({
  label,
  minHeight,
  style,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; minHeight?: number }) {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, minHeight ? { minHeight, textAlignVertical: 'top', paddingTop: Spacing.md } : null, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
    </View>
  );
}

function TaskCard({
  task,
  reviewing,
  onApprove,
  onReject,
}: {
  task: TeamTask;
  reviewing: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const statusColor = getStatusColor(task.status, colors);

  return (
    <Card style={styles.taskCard}>
      <View style={styles.taskTop}>
        <View style={styles.taskMain}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskAssignee}>{task.assignee?.name || 'Employee'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabels[task.status]}</Text>
        </View>
      </View>

      <Text style={styles.taskDescription}>{task.description}</Text>

      <View style={styles.taskMetaRow}>
        <IconSymbol name="calendar" size={15} color={colors.textMuted} />
        <Text style={styles.taskMetaText}>
          {task.due_date ? `Due ${formatDate(task.due_date)}` : 'No due date'}
        </Text>
      </View>

      {task.submission_note ? (
        <View style={styles.submissionBox}>
          <Text style={styles.submissionLabel}>Submission</Text>
          <Text style={styles.submissionText}>{task.submission_note}</Text>
          {task.submitted_at ? <Text style={styles.submissionTime}>{formatDateTime(task.submitted_at)}</Text> : null}
        </View>
      ) : null}

      {task.assignee?.trust_score != null ? (
        <View style={styles.trustRow}>
          <Text style={styles.trustLabel}>Employee TrustScore</Text>
          <TrustScoreBadge score={task.assignee.trust_score} size="small" />
        </View>
      ) : null}

      {task.status === 'submitted' ? (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} disabled={reviewing} onPress={onReject}>
            <Text style={[styles.actionText, { color: colors.error }]}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.approveButton]} disabled={reviewing} onPress={onApprove}>
            {reviewing ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.actionText, { color: colors.background }]}>Approve</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </Card>
  );
}

function getStatusColor(status: TeamTask['status'], colors: ThemeColors) {
  if (status === 'approved') return colors.success;
  if (status === 'rejected') return colors.error;
  if (status === 'submitted') return colors.warning;
  return colors.info;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingBottom: Spacing['3xl'],
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      gap: Spacing.md,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
    },
    header: {
      padding: Spacing.lg,
      paddingTop: Spacing['2xl'],
    },
    headerEyebrow: {
      color: colors.primary,
      fontSize: Typography.sm,
      fontWeight: '800',
      marginBottom: Spacing.xs,
    },
    headerTitle: {
      color: colors.text,
      fontSize: Typography['3xl'],
      fontWeight: '800',
    },
    headerSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.base,
      marginTop: Spacing.xs,
    },
    formCard: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    cardTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: '800',
      marginBottom: Spacing.md,
    },
    fieldLabel: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    employeePicker: {
      gap: Spacing.sm,
      paddingBottom: Spacing.md,
    },
    employeeChip: {
      width: 170,
      backgroundColor: colors.backgroundLight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
    },
    employeeChipSelected: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}18`,
    },
    employeeChipName: {
      color: colors.text,
      fontSize: Typography.sm,
      fontWeight: '800',
    },
    employeeChipNameSelected: {
      color: colors.primary,
    },
    employeeChipEmail: {
      color: colors.textMuted,
      fontSize: Typography.xs,
      marginTop: 2,
    },
    employeeChipEmailSelected: {
      color: colors.textSecondary,
    },
    inputGroup: {
      marginBottom: Spacing.md,
    },
    input: {
      minHeight: 50,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundLight,
      color: colors.text,
      fontSize: Typography.base,
      paddingHorizontal: Spacing.md,
    },
    primaryButton: {
      height: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    primaryButtonText: {
      color: colors.background,
      fontSize: Typography.base,
      fontWeight: '800',
    },
    disabledButton: {
      opacity: 0.55,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: '800',
    },
    sectionMeta: {
      color: colors.textMuted,
      fontSize: Typography.sm,
      fontWeight: '700',
    },
    list: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['2xl'],
      gap: Spacing.md,
    },
    taskCard: {
      gap: Spacing.md,
    },
    taskTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    taskMain: {
      flex: 1,
      marginRight: Spacing.md,
    },
    taskTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: '800',
    },
    taskAssignee: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      marginTop: 2,
    },
    statusBadge: {
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    statusText: {
      fontSize: Typography.xs,
      fontWeight: '800',
    },
    taskDescription: {
      color: colors.text,
      fontSize: Typography.base,
      lineHeight: 22,
    },
    taskMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    taskMetaText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
    },
    submissionBox: {
      backgroundColor: colors.backgroundLight,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
    },
    submissionLabel: {
      color: colors.textMuted,
      fontSize: Typography.xs,
      fontWeight: '800',
      marginBottom: Spacing.xs,
    },
    submissionText: {
      color: colors.text,
      fontSize: Typography.sm,
      lineHeight: 20,
    },
    submissionTime: {
      color: colors.textMuted,
      fontSize: Typography.xs,
      marginTop: Spacing.xs,
    },
    trustRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    trustLabel: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      fontWeight: '700',
    },
    actions: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    actionButton: {
      flex: 1,
      height: 42,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rejectButton: {
      backgroundColor: colors.backgroundLight,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    approveButton: {
      backgroundColor: colors.primary,
    },
    actionText: {
      fontSize: Typography.sm,
      fontWeight: '800',
    },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: Spacing['2xl'],
    },
    emptyTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: '800',
      marginTop: Spacing.md,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
    emptyInline: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      paddingVertical: Spacing.sm,
    },
  });

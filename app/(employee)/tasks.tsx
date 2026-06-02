/**
 * Employee Tasks Screen
 * View assigned tasks, submit work, and track status.
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
import { taskService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { ERROR_MESSAGES } from '@/utils/constants';
import DecorativeShapes from '@/components/DecorativeShapes';

type TaskStatus = 'assigned' | 'submitted' | 'approved' | 'rejected';

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  due_date?: string | null;
  submission_note?: string | null;
  review_notes?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  creator?: { name: string; email: string } | null;
  reviewer?: { name: string; email: string } | null;
}

export default function EmployeeTasksScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const user = useAuthStore((state) => state.user);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await taskService.getMyTasks(user.id);
      setTasks(data as Task[]);
    } catch (error) {
      console.error('Load tasks error:', error);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks]),
  );

  const handleSubmitTask = async (taskId: string) => {
    if (!submissionNotes.trim()) {
      Alert.alert('Error', ERROR_MESSAGES.REQUIRED_FIELD);
      return;
    }

    setIsSubmitting(true);
    try {
      await taskService.submitTask(taskId, submissionNotes);
      setSubmissionNotes('');
      setExpandedTaskId(null);
      Alert.alert('Success', 'Task submitted successfully');
      await loadTasks();
    } catch (error: any) {
      console.error('Submit task error:', error);
      Alert.alert('Error', error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'approved':
        return colors.success;
      case 'rejected':
        return colors.error;
      case 'submitted':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'assigned':
        return 'To Do';
      case 'submitted':
        return 'In Review';
      case 'approved':
        return 'Done';
      case 'rejected':
        return 'Needs Revision';
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const groupByStatus = (tasks: Task[]) => {
    const groups: Record<TaskStatus, Task[]> = {
      assigned: [],
      submitted: [],
      approved: [],
      rejected: [],
    };
    tasks.forEach((task) => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });
    return groups;
  };

  const renderTask = (task: Task) => {
    const isExpanded = expandedTaskId === task.id;
    const canSubmit = task.status === 'assigned' || task.status === 'rejected';

    return (
      <Card key={task.id} style={styles.taskCard}>
        <TouchableOpacity
          style={styles.taskHeader}
          onPress={() => setExpandedTaskId(isExpanded ? null : task.id)}>
          <View style={styles.taskTitleRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]} />
            <Text style={styles.taskTitle}>{task.title}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(task.status)}</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.taskBody}>
            <Text style={styles.taskDescription}>{task.description}</Text>

            {task.due_date && (
              <Text style={styles.taskMeta}>
                Due: {formatDate(task.due_date)}
              </Text>
            )}

            <Text style={styles.taskMeta}>
              Assigned by: {task.creator?.name || 'Unknown'}
            </Text>

            {task.status === 'submitted' && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Submission note:</Text>
                <Text style={styles.noteText}>{task.submission_note || '-'}</Text>
                <Text style={[styles.noteLabel, { marginTop: Spacing.sm }]}>
                  Waiting for review...
                </Text>
              </View>
            )}

            {task.status === 'approved' && task.review_notes && (
              <View style={[styles.noteBox, { borderColor: colors.success }]}>
                <Text style={[styles.noteLabel, { color: colors.success }]}>
                  Approved — Reviewer notes:
                </Text>
                <Text style={styles.noteText}>{task.review_notes}</Text>
              </View>
            )}

            {task.status === 'rejected' && task.review_notes && (
              <View style={[styles.noteBox, { borderColor: colors.error }]}>
                <Text style={[styles.noteLabel, { color: colors.error }]}>
                  Rejected — Reviewer feedback:
                </Text>
                <Text style={styles.noteText}>{task.review_notes}</Text>
              </View>
            )}

            {canSubmit && (
              <View style={styles.submitSection}>
                <Input
                  label="Submission Note"
                  placeholder="Describe what you've done..."
                  value={submissionNotes}
                  onChangeText={setSubmissionNotes}
                  multiline
                  numberOfLines={4}
                />
                <Button
                  title="Submit Task"
                  onPress={() => handleSubmitTask(task.id)}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  size="large"
                />
              </View>
            )}
          </View>
        )}
      </Card>
    );
  };

  const renderSection = (title: string, tasks: Task[]) => {
    if (tasks.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {title} ({tasks.length})
        </Text>
        {tasks.map(renderTask)}
      </View>
    );
  };

  const grouped = groupByStatus(tasks);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <DecorativeShapes variant="employee" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned
          </Text>
        </View>

        {tasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No tasks assigned</Text>
            <Text style={styles.emptySubtitle}>
              Tasks from your supervisor will appear here.
            </Text>
          </Card>
        ) : (
          <>
            {renderSection('To Do', grouped.assigned)}
            {renderSection('In Review', grouped.submitted)}
            {renderSection('Needs Revision', grouped.rejected)}
            {renderSection('Completed', grouped.approved)}
          </>
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
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      fontSize: Typography.lg,
      fontWeight: '700',
      color: colors.text,
      marginBottom: Spacing.md,
    },
    taskCard: {
      marginBottom: Spacing.md,
    },
    taskHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    taskTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: Spacing.sm,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    taskTitle: {
      fontSize: Typography.base,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
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
    },
    taskBody: {
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    taskDescription: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: Spacing.md,
    },
    taskMeta: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    noteBox: {
      backgroundColor: colors.backgroundLight,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    noteLabel: {
      fontSize: Typography.sm,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    noteText: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    submitSection: {
      marginTop: Spacing.lg,
      gap: Spacing.md,
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
  });

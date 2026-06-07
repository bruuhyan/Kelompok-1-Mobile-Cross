/**
 * Employee Reports Screen
 * Submit employee reports with optional photo attachment.
 */

import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
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
import { reportService } from '@/services/supabase';
import { storageService } from '@/services/storageService';
import { useAuthStore } from '@/store/authStore';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/constants';
import type { Report } from '@/utils/types';
import DecorativeShapes from '@/components/DecorativeShapes';

type ReportErrors = {
  title?: string;
  content?: string;
};

const formatDateTime = (value: string) => {
  if (!value) return '-';

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function EmployeeReportsScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const user = useAuthStore((state) => state.user);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<ReportErrors>({});
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ uri: string; base64: string } | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const loadReports = useCallback(async () => {
    if (!user?.id) return;

    setIsRefreshing(true);
    try {
      const data = await reportService.getUserReports(user.id);
      setReports(data as Report[]);
    } catch (error) {
      console.error('Load reports error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports]),
  );

  const validateForm = () => {
    const nextErrors: ReportErrors = {};

    if (!title.trim()) {
      nextErrors.title = ERROR_MESSAGES.REQUIRED_FIELD;
    }

    if (!content.trim()) {
      nextErrors.content = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (content.trim().length < 10) {
      nextErrors.content = 'Report must be at least 10 characters';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmitReport = async () => {
    if (!validateForm()) return;
    if (!user?.id || !user.organization_id) {
      Alert.alert('Error', 'User profile is not ready yet');
      return;
    }

    setIsLoading(true);
    try {
      let photoUrl: string | undefined;

      if (selectedPhoto) {
        setIsUploadingPhoto(true);
        const tempReportId = 'temp_' + Date.now();
        photoUrl = await storageService.uploadReportPhoto(user.id, tempReportId, selectedPhoto.base64);
        setIsUploadingPhoto(false);
      }

      await reportService.submitReport(user.id, user.organization_id, {
        title,
        content,
        photo: photoUrl,
      });

      setTitle('');
      setContent('');
      setSelectedPhoto(null);
      Alert.alert('Success', SUCCESS_MESSAGES.REPORT_SUBMITTED);
      await loadReports();
    } catch (error: any) {
      console.error('Submit report error:', error);
      setIsUploadingPhoto(false);
      Alert.alert('Error', error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const image = await storageService.pickReportPhoto();
      if (image) {
        setSelectedPhoto(image);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'reviewed':
      case 'resolved':
        return colors.success;
      case 'submitted':
        return colors.info;
      default:
        return colors.warning;
    }
  };

  const renderReportItem = (report: Report) => (
    <Card key={report.id} style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={styles.historyTitleWrap}>
          <Text style={styles.historyTitle}>{report.title}</Text>
          <Text style={styles.historyDate}>{formatDateTime(report.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
          <Text style={styles.statusText}>{report.status}</Text>
        </View>
      </View>
      <Text style={styles.historyContent} numberOfLines={3}>
        {report.content}
      </Text>
    </Card>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <DecorativeShapes variant="employee" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Submit work updates and incident reports</Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Submit Report</Text>
          <Input
            label="Title"
            placeholder="Example: Daily site update"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
          />
          <Input
            label="Report Detail"
            placeholder="Write your report details"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            error={errors.content}
          />

          {selectedPhoto ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: selectedPhoto.uri }} style={styles.photoImage} />
              <TouchableOpacity style={styles.removePhotoBtn} onPress={handleRemovePhoto}>
                <Text style={styles.removePhotoText}>Remove Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.attachPhotoBtn} onPress={handlePickPhoto}>
              <Text style={styles.attachPhotoText}>Attach Photo</Text>
            </TouchableOpacity>
          )}

          <Button
            title="Submit Report"
            onPress={handleSubmitReport}
            loading={isLoading || isUploadingPhoto}
            disabled={isLoading || isUploadingPhoto}
            size="large"
          />
        </Card>

        <View style={styles.historySectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          <TouchableOpacity onPress={loadReports} disabled={isRefreshing}>
            <Text style={styles.refreshText}>{isRefreshing ? 'Loading...' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>

        {reports.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No reports yet</Text>
            <Text style={styles.emptySubtitle}>Submitted reports will appear here.</Text>
          </Card>
        ) : (
          reports.map(renderReportItem)
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
      paddingBottom: Spacing['3xl'] + Spacing['2xl'],
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
    historyTitleWrap: {
      flex: 1,
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
    historyContent: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      marginTop: Spacing.md,
      lineHeight: 20,
    },
    attachPhotoBtn: {
      backgroundColor: colors.backgroundLight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    attachPhotoText: {
      fontSize: Typography.sm,
      fontWeight: '600',
      color: colors.primary,
    },
    photoPreview: {
      marginBottom: Spacing.md,
    },
    photoImage: {
      width: '100%',
      height: 200,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.sm,
    },
    removePhotoBtn: {
      alignItems: 'center',
      padding: Spacing.sm,
    },
    removePhotoText: {
      fontSize: Typography.sm,
      fontWeight: '600',
      color: colors.error,
    },
  });

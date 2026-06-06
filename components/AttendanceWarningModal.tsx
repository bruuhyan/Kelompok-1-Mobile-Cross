import { BorderRadius, Spacing, ThemeColors, Typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { AttendanceValidationFlowResult } from "@/utils/types";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { IconSymbol } from "./ui/icon-symbol";

type AttendanceWarningModalProps = {
  visible: boolean;
  result: AttendanceValidationFlowResult | null;
  actionLabel: "check-in" | "check-out";
  onClose: () => void;
};

function getViolationItems(result: AttendanceValidationFlowResult | null) {
  if (!result) return [];

  const { validation } = result;
  const items: { title: string; message: string }[] = [];

  if (!validation.gps_valid) {
    items.push({
      title: "Di luar range GPS",
      message:
        validation.details?.gps?.message ||
        "Lokasi Anda berada di luar radius tempat kerja.",
    });
  }

  if (!validation.wifi_valid) {
    items.push({
      title: "WiFi tidak sesuai",
      message:
        validation.details?.wifi?.message ||
        "Jaringan WiFi Anda tidak sesuai dengan jaringan tempat kerja.",
    });
  }

  if (!validation.ip_valid) {
    items.push({
      title: "IP tidak sesuai",
      message:
        validation.details?.ip?.message ||
        "Alamat IP perangkat berada di luar range yang dikonfigurasi.",
    });
  }

  if (validation.spoofing_detected) {
    items.push({
      title: "Indikasi spoofing lokasi",
      message:
        validation.details?.spoofing?.message ||
        "Terdeteksi anomali pada integritas lokasi perangkat.",
    });
  }

  return items;
}

export function AttendanceWarningModal({
  visible,
  result,
  actionLabel,
  onClose,
}: AttendanceWarningModalProps) {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const violations = getViolationItems(result);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container}>
          <View style={styles.iconWrapper}>
            <IconSymbol
              name="exclamationmark.triangle.fill"
              size={30}
              color={colors.warning}
            />
          </View>

          <Text style={styles.title}>Attendance Warning</Text>
          <Text style={styles.subtitle}>
            {`Proses ${actionLabel} berhasil dikirim, tetapi attendance Anda akan ditandai untuk supervisor review.`}
          </Text>

          <View style={styles.violationList}>
            {violations.map((item) => (
              <View key={item.title} style={styles.violationItem}>
                <View style={styles.warningDot} />
                <View style={styles.violationText}>
                  <Text style={styles.violationTitle}>{item.title}</Text>
                  <Text style={styles.violationMessage}>{item.message}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Saya Mengerti</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.lg,
    },
    container: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: `${colors.warning}66`,
      padding: Spacing.lg,
    },
    iconWrapper: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius.full,
      backgroundColor: `${colors.warning}22`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: Typography.xl,
      fontWeight: "800",
      marginBottom: Spacing.sm,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      lineHeight: 20,
      marginBottom: Spacing.lg,
    },
    violationList: {
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    violationItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
    },
    warningDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.warning,
      marginTop: 6,
    },
    violationText: {
      flex: 1,
    },
    violationTitle: {
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: "700",
      marginBottom: 2,
    },
    violationMessage: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      lineHeight: 19,
    },
    closeButton: {
      backgroundColor: colors.warning,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      paddingVertical: Spacing.md,
      minHeight: 48,
      justifyContent: "center",
    },
    closeButtonText: {
      color: "#FFFFFF",
      fontSize: Typography.base,
      fontWeight: "700",
    },
  });
